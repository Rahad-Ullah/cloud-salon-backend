import { UserRole } from '../user/user.constant';
import { User } from '../user/user.model';
import { Appointment } from '../appointment/appointment.model';
import { AppointmentStatus } from '../appointment/appointment.constants';
import { Review } from '../review/review.model';
import { Wishlist } from '../wishlist/wishlist.model';
import { Types } from 'mongoose';
import { EntityType } from '../review/review.constants';
import { Salon } from '../salon/salon.model';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// ----------------- get user overview -----------------
const getCustomerOverview = async (userId: string) => {
  const customerId = new Types.ObjectId(userId);
  const now = new Date();

  const [appointmentCounts, totalReviews, totalWishlists] = await Promise.all([
    Appointment.aggregate([
      { $match: { customer: customerId, isDeleted: false } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          upcoming: [
            {
              $match: {
                status: AppointmentStatus.Confirmed,
                startsAt: { $gte: now },
              },
            },
            { $count: 'count' },
          ],
          completed: [
            {
              $match: { status: AppointmentStatus.Completed },
            },
            { $count: 'count' },
          ],
        },
      },
    ]),
    Review.countDocuments({ user: userId, isDeleted: false }),
    Wishlist.countDocuments({ user: userId, isDeleted: false }),
  ]);

  const facet = appointmentCounts[0];

  return {
    totalAppointments: facet.total[0]?.count ?? 0,
    totalUpcomingAppointments: facet.upcoming[0]?.count ?? 0,
    totalCompletedAppointments: facet.completed[0]?.count ?? 0,
    totalReviews,
    totalWishlists,
  };
};

// ----------------- get professional overview -----------------
const getProfessionalOverview = async (userId: string) => {
  const professionalId = new Types.ObjectId(userId);
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const startOfNextYear = new Date(currentYear + 1, 0, 1);

  const [appointmentData, totalReviews] = await Promise.all([
    Appointment.aggregate([
      {
        $match: {
          professional: professionalId,
          isDeleted: false,
        },
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          upcoming: [
            {
              $match: {
                status: AppointmentStatus.Confirmed,
                startsAt: { $gte: now },
              },
            },
            { $count: 'count' },
          ],
          completed: [
            { $match: { status: AppointmentStatus.Completed } },
            { $count: 'count' },
          ],
          monthlyGrowth: [
            {
              $match: {
                createdAt: {
                  $gte: startOfYear,
                  $lt: startOfNextYear,
                },
              },
            },
            {
              $group: {
                _id: { $month: '$createdAt' }, // 1 to 12
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]),
    Review.countDocuments({
      entityType: EntityType.User,
      entity: userId,
      isDeleted: false,
    }),
  ]);

  const facet = appointmentData[0] ?? {};

  // Map aggregated counts to month numbers (1 -> count, 2 -> count, ...)
  const countsByMonthNumber = new Map<number, number>();
  for (const item of facet.monthlyGrowth ?? []) {
    countsByMonthNumber.set(item._id, item.count);
  }

  // Generate fixed 12-month array with "Jan", "Feb", ... and default 0
  const monthlyAppointmentsGrowth = MONTH_NAMES.map((name, index) => ({
    month: name,
    count: countsByMonthNumber.get(index + 1) ?? 0,
  }));

  return {
    totalAppointments: facet.total?.[0]?.count ?? 0,
    totalUpcomingAppointments: facet.upcoming?.[0]?.count ?? 0,
    totalCompletedAppointments: facet.completed?.[0]?.count ?? 0,
    totalReviews,
    monthlyAppointmentsGrowth,
  };
};

// ---------------- admin dashboard overview -----------------
const getAdminOverview = async () => {
  const [userRoleCounts, totalSalons, totalAppointments, totalReviews] =
    await Promise.all([
      User.aggregate([
        {
          $match: {
            role: { $in: [UserRole.Customer, UserRole.Professional] },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),
      Salon.countDocuments({ isDeleted: false }),
      Appointment.countDocuments({ isDeleted: false }),
      Review.countDocuments({ isDeleted: false }),
    ]);

  const roleMap = new Map<string, number>();
  for (const item of userRoleCounts) {
    roleMap.set(item._id, item.count);
  }

  return {
    totalCustomers: roleMap.get(UserRole.Customer) ?? 0,
    totalProfessionals: roleMap.get(UserRole.Professional) ?? 0,
    totalSalons,
    totalAppointments,
    totalReviews,
  };
};

// ---------------- get monthly user growth ----------------
const getUserGrowth = async (query: Record<string, unknown> = {}) => {
  const parsedYear = Number(query.year);
  const targetYear =
    Number.isInteger(parsedYear) && parsedYear > 1970 && parsedYear < 3000
      ? parsedYear
      : new Date().getUTCFullYear();

  const timezone = typeof query.timezone === 'string' ? query.timezone : 'UTC';

  // Explicit UTC boundary dates
  const startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(targetYear + 1, 0, 1, 0, 0, 0));

  const aggregateResult = await User.aggregate<{ _id: number; count: number }>([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          $month: {
            date: '$createdAt',
            timezone: timezone, // Keeps month boundaries accurate to local time
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Fast lookup map
  const countsByMonth = new Map<number, number>();
  for (const item of aggregateResult) {
    countsByMonth.set(item._id, item.count);
  }

  // Guarantee continuous 12-month series
  return MONTH_NAMES.map((monthName, index) => {
    const monthNumber = index + 1;
    return {
      year: targetYear,
      month: monthNumber,
      monthName,
      count: countsByMonth.get(monthNumber) ?? 0,
    };
  });
};

export const AnalyticsServices = {
  getCustomerOverview,
  getProfessionalOverview,
  getAdminOverview,
  getUserGrowth,
};
