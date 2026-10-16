import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Salon } from '../../src/app/modules/salon/salon.model';
import { Chair } from '../../src/app/modules/chair/chair.model';
import { ChairRental } from '../../src/app/modules/chairRental/chairRental.model';
import { Appointment } from '../../src/app/modules/appointment/appointment.model';
import { Transaction } from '../../src/app/modules/transaction/transaction.model';
import { StripeEvent } from '../../src/app/modules/stripeEvent/stripeEvent.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { RentalStatus, PaymentStatus as RentalPaymentStatus } from '../../src/app/modules/chairRental/chairRental.constants';
import { AppointmentStatus, PaymentStatus as AptPaymentStatus } from '../../src/app/modules/appointment/appointment.constants';
import {
  TransactionGateway,
  TransactionReferenceType,
  TransactionStatus,
  TransactionType,
} from '../../src/app/modules/transaction/transaction.constants';

describe('Stripe Webhook Integration Endpoint', () => {
  const setupPrerequisites = async () => {
    const customer = await User.create({
      firstName: 'Stripe',
      lastName: 'Tester',
      email: 'stripe.tester@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Customer,
      isEmailVerified: true,
      status: UserStatus.Active,
    });

    const professional = await User.create({
      firstName: 'Pro',
      lastName: 'Stylist',
      email: 'pro.stripe@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Professional,
      isEmailVerified: true,
      status: UserStatus.Active,
    });

    const salon = await Salon.create({
      name: 'Stripe Salon',
      businessType: 'Hair Salon',
      email: 'stripe.salon@cloudsalon.com',
      phone: '+1 800 555 0199',
      address: {
        line1: '500 Madison Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10022',
        country: 'USA',
      },
      location: {
        type: 'Point',
        coordinates: [-73.97, 40.76],
      },
      createdBy: professional._id,
    });

    const chair = await Chair.create({
      name: 'Chair 1',
      location: 'Section A',
      pricePerDayInUSD: 40,
      salon: salon._id,
    });

    const chairRental = await ChairRental.create({
      professional: professional._id,
      chair: chair._id,
      salon: salon._id,
      status: RentalStatus.Active,
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      durationInDays: 5,
      pricing: { total: 200, currency: 'USD' },
    });

    const appointment = await Appointment.create({
      customer: customer._id,
      professional: professional._id,
      salon: salon._id,
      chair: chair._id,
      services: [new mongoose.Types.ObjectId()],
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
      totalDurationInMinutes: 60,
      pricing: { subtotal: 50, discount: 0, total: 50, currency: 'USD' },
      status: AppointmentStatus.Pending,
    });

    return { customer, professional, salon, chair, chairRental, appointment };
  };

  describe('POST /webhooks/stripe', () => {
    it('should return 400 when webhook signature is invalid', async () => {
      const res = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 'invalid_signature_mock')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'test.event' }));

      expect(res.status).toBe(400);
      expect(res.text).toMatch(/Webhook Error: Invalid signature/i);
    });

    it('should process checkout.session.completed for Appointment and update payment status', async () => {
      const { customer, appointment } = await setupPrerequisites();
      const eventId = `evt_apt_${Date.now()}`;
      const sessionId = `cs_apt_${Date.now()}`;

      // Create pre-existing pending transaction
      await Transaction.create({
        user: customer._id,
        type: TransactionType.Payment,
        gateway: TransactionGateway.Stripe,
        gatewayReferenceId: sessionId,
        amount: 50,
        netAmount: 50,
        status: TransactionStatus.Pending,
        reference: {
          type: TransactionReferenceType.Appointment,
          id: appointment._id.toString(),
        },
      });

      const webhookPayload = {
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            currency: 'usd',
            payment_intent: 'pi_test_apt_123',
            metadata: {
              userId: customer._id.toString(),
              referenceType: TransactionReferenceType.Appointment,
              referenceId: appointment._id.toString(),
            },
          },
        },
      };

      const res = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 'valid_test_signature')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(webhookPayload));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });

      // Verify Appointment updated to Paid
      const updatedApt = await Appointment.findById(appointment._id);
      expect(updatedApt?.paymentStatus).toBe(AptPaymentStatus.Paid);
      expect(updatedApt?.transaction).toBeDefined();

      // Verify idempotency record logged in StripeEvent
      const loggedEvent = await StripeEvent.findOne({ id: eventId });
      expect(loggedEvent).toBeDefined();
    });

    it('should process checkout.session.completed for ChairRental and update payment status', async () => {
      const { professional, chairRental } = await setupPrerequisites();
      const eventId = `evt_rental_${Date.now()}`;
      const sessionId = `cs_rental_${Date.now()}`;

      // Create pre-existing pending transaction
      await Transaction.create({
        user: professional._id,
        type: TransactionType.Payment,
        gateway: TransactionGateway.Stripe,
        gatewayReferenceId: sessionId,
        amount: 200,
        netAmount: 200,
        status: TransactionStatus.Pending,
        reference: {
          type: TransactionReferenceType.ChairRental,
          id: chairRental._id.toString(),
        },
      });

      const webhookPayload = {
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            currency: 'usd',
            payment_intent: 'pi_test_rental_123',
            metadata: {
              userId: professional._id.toString(),
              referenceType: TransactionReferenceType.ChairRental,
              referenceId: chairRental._id.toString(),
            },
          },
        },
      };

      const res = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 'valid_test_signature')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(webhookPayload));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });

      // Verify ChairRental updated to Paid
      const updatedRental = await ChairRental.findById(chairRental._id);
      expect(updatedRental?.paymentStatus).toBe(RentalPaymentStatus.Paid);
    });

    it('should ignore duplicate events (idempotency guard)', async () => {
      const { customer, appointment } = await setupPrerequisites();
      const duplicateEventId = 'evt_duplicate_idempotency_123';

      // Pre-seed the event in StripeEvent ledger
      await StripeEvent.create({
        id: duplicateEventId,
        type: 'checkout.session.completed',
      });

      const webhookPayload = {
        id: duplicateEventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_duplicate_session',
            payment_status: 'paid',
            currency: 'usd',
            payment_intent: 'pi_duplicate',
            metadata: {
              userId: customer._id.toString(),
              referenceType: TransactionReferenceType.Appointment,
              referenceId: appointment._id.toString(),
            },
          },
        },
      };

      const res = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 'valid_test_signature')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(webhookPayload));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });

      // Verify Appointment was NOT touched because event was skipped
      const untouchedApt = await Appointment.findById(appointment._id);
      expect(untouchedApt?.paymentStatus).toBe(AptPaymentStatus.Unpaid);
    });
  });
});
