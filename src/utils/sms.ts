import axios from "axios";

export const sendSms = async (message: string, to: string) => {
  try {
    const request = await axios.post(`https://api.sms.net.bd/sendsms`, {
      api_key: "YgD2T7OI1esZXbkhTm5HRZwUu3g2hp22hbZE0dt0",
      msg: message,
      to,
    });

    return request.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
