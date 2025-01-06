import { websiteUrl } from 'src/constant/website.constants';

export const logoutTemplate = (
  name: string,
  link: string,
  platform: string,
  time: string,
) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Logout Request</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: #ffffff;
      margin: 20px auto;
      padding: 20px;
      width: 80%;
      max-width: 600px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333;
    }
    p {
      color: #555;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 24px;
      margin-top: 20px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 16px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Logout Request</h1>
    <p>Hi ${name}</p>
    <p>We noticed a login attempt of account <strong>${platform}</strong> this account was logged in <strong>${time}</strong>.</p>
    <p>If you t initiate this login, you can log out from your account using the link below:</p>
    <p><a href=${link} class="cta-button">Log Out Now</a></p>
    <p>If you did not request this, please ignore this email. Your account is secure.</p>
    <div class="footer">
      <p>&copy; <%= new Date().getFullYear() %> Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
};
