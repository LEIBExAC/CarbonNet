const axios = require("axios");

/**
 * Email Microservice Client
 * Sends emails via AWS Lightsail microservice instead of direct SMTP
 */
class EmailMicroserviceClient {
  constructor() {
    this.baseURL =
      process.env.EMAIL_MICROSERVICE_URL || "http://localhost:3000";
    this.apiKey = process.env.EMAIL_MICROSERVICE_API_KEY;
    this.timeout = 30000; // 30 seconds

    if (!this.apiKey) {
      console.warn("EMAIL_MICROSERVICE_API_KEY not configured");
    }
  }

  /**
   * Send a single email
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.apiKey) {
      console.warn("Email not sent - Microservice API key not configured");
      return {
        success: false,
        message: "Email microservice not configured",
        warning: true,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/send-email`,
        {
          to,
          subject,
          html,
          text,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
          },
          timeout: this.timeout,
        }
      );

      console.log("Email sent via microservice");
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);

      return {
        success: true,
        messageId: response.data.messageId,
      };
    } catch (error) {
      console.error("Email microservice error:", error.message);

      if (error.code === "ECONNREFUSED") {
        console.error("Cannot connect to email microservice");
        console.error(
          "Check EMAIL_MICROSERVICE_URL and ensure service is running"
        );
      } else if (error.response?.status === 401) {
        console.error("Invalid API key");
        console.error("Check EMAIL_MICROSERVICE_API_KEY");
      }

      return {
        success: false,
        message: "Failed to send email via microservice",
        error: error.message,
      };
    }
  }

  /**
   * Send multiple emails in batch
   */
  async sendBatch(emails) {
    if (!this.apiKey) {
      console.warn(
        "Batch email not sent - Microservice API key not configured"
      );
      return {
        success: false,
        message: "Email microservice not configured",
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/send-batch`,
        { emails },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
          },
          timeout: this.timeout * 2, // 60 seconds for batch
        }
      );

      console.log(
        `Batch email completed: ${response.data.successful} sent, ${response.data.failed} failed`
      );

      return response.data;
    } catch (error) {
      console.error("Batch email error:", error.message);
      return {
        success: false,
        message: "Failed to send batch emails",
        error: error.message,
      };
    }
  }

  /**
   * Check microservice health
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: "Email microservice is not responding",
        error: error.message,
      };
    }
  }
}

module.exports = new EmailMicroserviceClient();
