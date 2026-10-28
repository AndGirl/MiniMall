// 会员等级
export const MEMBER_LEVELS = {
  NORMAL: "NORMAL",
  XINYUE1: "XINYUE1",
  XINYUE2: "XINYUE2",
  XINYUE3: "XINYUE3",
} as const;
export type MemberLevel = (typeof MEMBER_LEVELS)[keyof typeof MEMBER_LEVELS];

// 会员等级配置：门槛（累计下单原价，单位分）与折扣率
export const MEMBER_LEVEL_CONFIG: Record<
  MemberLevel,
  { label: string; threshold: number; discountRate: number }
> = {
  NORMAL: { label: "普通会员", threshold: 0, discountRate: 1.0 },
  XINYUE1: { label: "心悦1", threshold: 800000, discountRate: 0.98 },
  XINYUE2: { label: "心悦2", threshold: 8000000, discountRate: 0.95 },
  XINYUE3: { label: "心悦3", threshold: 80000000, discountRate: 0.9 },
};

// 按累计下单原价判定会员等级
export function getMemberLevelBySpent(totalSpent: number): MemberLevel {
  if (totalSpent >= MEMBER_LEVEL_CONFIG.XINYUE3.threshold) return MEMBER_LEVELS.XINYUE3;
  if (totalSpent >= MEMBER_LEVEL_CONFIG.XINYUE2.threshold) return MEMBER_LEVELS.XINYUE2;
  if (totalSpent >= MEMBER_LEVEL_CONFIG.XINYUE1.threshold) return MEMBER_LEVELS.XINYUE1;
  return MEMBER_LEVELS.NORMAL;
}

// 获取指定等级的折扣率
export function getDiscountRate(level: MemberLevel): number {
  return MEMBER_LEVEL_CONFIG[level].discountRate;
}

// 计算订单金额：折前小计、优惠金额、折后应付（单位均为分）
export function computeOrderAmounts(subtotalAmount: number, discountRate: number) {
  const totalAmount = Math.round(subtotalAmount * discountRate);
  const discountAmount = subtotalAmount - totalAmount;
  return { subtotalAmount, discountAmount, totalAmount };
}
