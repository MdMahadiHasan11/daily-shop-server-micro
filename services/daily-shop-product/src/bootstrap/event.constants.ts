export interface EventType<T = any> {
  payload: T;
}
export const EVENTS = {
  AFTER_PRODUCT_CREATE_NEED_INVENTORY: "AFTER_PRODUCT_CREATE_NEED_INVENTORY",
};
