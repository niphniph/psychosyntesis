export function getErrorMessage(error: any): string {
  const responseData = error?.response?.data;

  if (typeof responseData === "string") {
    if (responseData.includes('<html') || responseData.includes('<!DOCTYPE')) {
      return `API endpoint-მა დააბრუნა HTML (${error?.response?.status || 404}). შეამოწმეთ API მისამართი.`;
    }
    return responseData;
  }

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof responseData?.error === "string") {
    return responseData.error;
  }

  if (typeof responseData?.error?.message === "string") {
    return responseData.error.message;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "An unexpected error occurred.";
}
