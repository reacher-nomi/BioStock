// Turn any axios/FastAPI error into a readable string.
// FastAPI 422 responses put validation errors in an ARRAY under `detail`,
// so we can't just render `detail` directly.
export function apiErrorMessage(err, fallback = "Something went wrong") {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail[0]?.msg || fallback;
  if (err?.message === "Network Error") return "Can't reach the server. Check your connection.";
  return fallback;
}

// Client-side password rule mirroring the backend (min 8, a letter and a digit).
export function passwordProblem(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Password needs at least one letter and one number.";
  return null;
}
