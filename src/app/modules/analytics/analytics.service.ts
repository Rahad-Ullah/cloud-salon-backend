import { UserRole } from '../user/user.constant';
import { User } from '../user/user.model';
import { Appointment } from '../appointment/appointment.model';
import { AppointmentStatus } from '../appointment/appointment.constants';
import { Review } from '../review/review.model';
import { Wishlist } from '../wishlist/wishlist.model';
import { Types } from 'mongoose';
import { EntityType } from '../review/review.constants';

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
  const [totalUsers, totalMerchants] = await Promise.all([
    User.countDocuments({ role: UserRole.Customer, isDeleted: false }),
    User.countDocuments({ role: UserRole.Professional, isDeleted: false }),
  ]);

  return {
    totalUsers,
    totalMerchants,
  };
};

// ---------------- get monthly user growth ----------------
const getUserGrowth = async (query: Record<string, unknown>) => {
  const targetYear =
    parseInt(query?.year as string, 10) || new Date().getFullYear();

  const startDate = new Date(`${targetYear}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${targetYear + 1}-01-01T00:00:00.000Z`);

  const aggregateResult = await User.aggregate<{ _id: number; count: number }>([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' }, // Group strictly by month (1-12)
        count: { $sum: 1 },
      },
    },
  ]);

  // Create a fast lookup map: { monthNumber: count }
  const countsByMonth = aggregateResult.reduce<Record<number, number>>(
    (acc, item) => {
      acc[item._id] = item.count;
      return acc;
    },
    {},
  );

  // Month names for clean reporting
  const monthNames = [
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

  // Fill in all 12 months (guaranteeing complete data)
  const formattedResult = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1; // 1 to 12
    return {
      year: targetYear,
      month: monthNumber,
      monthName: monthNames[index],
      count: countsByMonth[monthNumber] || 0,
    };
  });

  return formattedResult;
};

export const AnalyticsServices = {
  getCustomerOverview,
  getProfessionalOverview,
  getAdminOverview,
  getUserGrowth,
};
