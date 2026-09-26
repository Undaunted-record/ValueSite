const ERROR_MESSAGES: Record<string, string> = {
  "010": "기업 자동 불러오기 인증을 확인할 수 없습니다.",
  "011": "기업 자동 불러오기 인증이 현재 중지되어 있습니다.",
  "012": "현재 접속 환경에서는 기업 정보를 불러올 수 없습니다.",
  "013": "조건에 맞는 공시 데이터를 찾지 못했습니다.",
  "014": "요청한 공시 파일을 찾지 못했습니다.",
  "020": "OpenDART 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
  "021": "한 번에 조회할 수 있는 기업 수를 초과했습니다.",
  "100": "기업 정보 요청값이 올바르지 않습니다.",
  "101": "허용되지 않은 기업 정보 요청입니다.",
  "800": "OpenDART 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요.",
  "900": "OpenDART에서 처리할 수 없는 오류가 발생했습니다.",
  "901": "OpenDART 인증 정보 갱신이 필요합니다.",
};

export class DartApiError extends Error {
  constructor(public readonly code: string, message?: string) {
    super(message ?? ERROR_MESSAGES[code] ?? "기업 정보를 불러오지 못했습니다.");
    this.name = "DartApiError";
  }

  get retryable() {
    return ["020", "800", "900"].includes(this.code);
  }
}

export function getDartErrorMessage(code: string) {
  return ERROR_MESSAGES[code] ?? "기업 정보를 불러오지 못했습니다.";
}

export function publicDartError(error: unknown) {
  if (error instanceof DartApiError) {
    return { error: error.message, code: error.code, retryable: error.retryable };
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return { error: "OpenDART 응답 시간이 초과되었습니다. 다시 시도해 주세요.", retryable: true };
  }
  return { error: "기업 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", retryable: true };
}
