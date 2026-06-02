import axios from "axios";

export const api = axios;

export const unwrap = (response, key) => response.data?.[key] ?? response.data;

export const currency = (amount = 0, code = "INR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 0 }).format(amount);

export const date = (value) =>
  value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "-";
