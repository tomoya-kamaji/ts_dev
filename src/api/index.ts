// API fetchで叩く

const BASE_URL = "http://localhost:8085";
const API_KEY = "partner_4PatLErZsd73urlULswUmR2KB7QnIBXJm";
interface Consent {
  id: number;
  patientCode: string;
  templateTitle: string;
  createdAt: string;
  consentedAt: string;
}

interface ConsentDetail {
  id: number;
  patientCode: string;
  templateTitle: string;
  pdfBase64: string;
  createdAt: string;
  consentedAt: string;
}

/**
 * 同意書リスト
 */
const fetchConsentList = async (): Promise<Consent[]> => {
  try {
    console.log(`${BASE_URL}/partner/v1/consents`);
    const response = await fetch(`${BASE_URL}/partner/v1/consents`, {
      headers: {
        "X-API-KEY": API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.data.consents;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

/**
 * 詳細
 */
interface DetailProps {
  id: string;
}
const fetchConsentDetail = async ({
  id,
}: DetailProps): Promise<ConsentDetail> => {
  try {
    const response = await fetch(`${BASE_URL}/partner/v1/consents/${id}`, {
      headers: {
        "X-API-KEY": API_KEY,
      },
    });
    // ステータスコード
    console.log(response.status);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    return data.data.consent;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

interface ConnectProps {
  data: {
    successIds: string[];
    failedIds: string[];
  };
}

const connectConsent = async ({ data }: ConnectProps) => {
  try {
    const response = await fetch(`${BASE_URL}/partner/v1/consents/connect`, {
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.status;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export { connectConsent, fetchConsentDetail, fetchConsentList };
