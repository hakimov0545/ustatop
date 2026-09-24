import { request, jsonBody } from "../../../shared/api/client.js";
export const getCategories = () => request("/api/categories");
export const suggestCategory = (description) =>
  request("/api/categories/suggest", {
    method: "POST",
    body: jsonBody({ description }),
  });
