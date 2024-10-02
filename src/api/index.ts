// API fetchで叩く

const BASE_URL = "http://localhost:8085";
const API_KEY = "partner_4PatLErZsd73urlULswUmR2KB7QnIBXJm";
// {
//     id: 3,
//     patientCode: 'memo',
//     templateTitle: '手術同意書2',
//     createdAt: 'Wed Oct 02 2024 11:14:16 GMT+0900 (日本標準時)',
//     consentedAt: 'Wed Oct 02 2024 11:14:54 GMT+0900 (日本標準時)'
//   },
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
const fetchConsentList = async () => {
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
    return data.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

/**
 * 詳細
 */
interface DetailProps {
  id: string;
}
const fetchConsentDetail = async ({ id }: DetailProps) => {
  try {
    const response = await fetch(`${BASE_URL}/partner/v1/consents/${id}`, {
      headers: {
        "X-API-KEY": API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    return data.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

interface ConnectProps {
  data: {
    successIds: string[];
    failedIds: string[];
  };
}

const connectConsent = async ({ data }: ConnectProps) => {
  await fetch(`${BASE_URL}/partner/v1/consents/connect`, {
    method: "POST",
    headers: {
      "X-API-KEY": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export { connectConsent, fetchConsentDetail, fetchConsentList };
