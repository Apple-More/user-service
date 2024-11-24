import bcrypt from 'bcryptjs';
import axios from 'axios';

const axiosInstance = axios.create({
  timeout: 5000,
});

const BASE_URL = 'http://localhost:8080/api';
const SERVICES_URL = {
  EMAIL_SERVICE_URL: 'emails',
};

/**
 * Hashes a password using bcrypt.
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

interface EmailPayload {
  emails: string[];
  subject: string;
  message: string;
}

export const sendEmail = async (emailPayload: EmailPayload) => {
  const { emails, subject, message } = emailPayload;
  // Send email implementation
  const emailResponse = await axiosInstance.post(
    `${BASE_URL}/${SERVICES_URL.EMAIL_SERVICE_URL}/v1/send`,
    {
      emails,
      subject,
      message,
    },
  );

  return emailResponse;
};
