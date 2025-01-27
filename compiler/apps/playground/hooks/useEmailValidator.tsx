// Regex
const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Hook
export const useEmailValidator = (email: string) => {
  // Error State
  let errorMsg = "";

  if (!email) {
    errorMsg = "Email is required field";
  } else if (!email.includes("@")) {
    errorMsg = "'@' is missing from the email";
  } else if (!email.includes(".")) {
    errorMsg = "'.' is missing from the email";
  } else if (!strictEmailRegex.test(email)) {
    errorMsg = "Please enter a valid email";
  }

  // Final output
  return errorMsg;
};
