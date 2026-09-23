import { Types } from 'mongoose';
import { Customer } from '../customer/customer.model';
import { UserRole } from '../user/user.constant';
import { User } from '../user/user.model';

// ----------------- get user overview -----------------
const getUserOverview = async (userId: string) => {
  return {};
};

// ----------------- get merchant overview -----------------
const getMerchantOverview = async (userId: string) => {
  return {};
};

// ---------------- admin dashboard overview -----------------
const getAdminOverview = async () => {
  const [totalUsers, totalMerchants] = await Promise.all([
    User.countDocuments({ role: UserRole.User, isDeleted: false }),
    User.countDocuments({ role: UserRole.Merchant, isDeleted: false }),
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
  getUserOverview,
  getMerchantOverview,
  getAdminOverview,
  getUserGrowth,
};
