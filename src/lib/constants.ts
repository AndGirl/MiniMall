// 用户角色
export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// 订单状态
export const ORDER_STATUSES = {
  PENDING: "PENDING",
  PAID: "PAID",
  SHIPPED: "SHIPPED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

// 订单状态机：每个状态允许迁移到的下一个状态
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

// 订单状态中文文案
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "待付款",
  PAID: "已支付",
  SHIPPED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

// 根据状态字符串返回中文标签（未知状态返回原值）
export function getOrderStatusLabel(status: string): string {
  return status in ORDER_STATUS_LABELS ? ORDER_STATUS_LABELS[status as OrderStatus] : status;
}

// 判断是否为合法订单状态
export function isOrderStatus(value: unknown): value is OrderStatus {
  return Object.values(ORDER_STATUSES).includes(value as OrderStatus);
}

// 商品列表每页条数
export const PAGE_SIZE = 9;
