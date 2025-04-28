import axios, { AxiosError } from "axios";

const AZURE_DEVOPS_PAT = "";
const AZURE_DEVOPS_BASE_URL = "https://dev.azure.com/yourorgname";

interface ProjectResponse {
  count: number;
  value: Array<{
    name: string;
    id: string;
  }>;
}

interface TestResult {
  endpoint: string;
  success: boolean;
  error?: string;
  data?: any;
}

class DevOpsPATTester {
  private baseUrl: string;
  private pat: string;

  constructor() {
    this.baseUrl = AZURE_DEVOPS_BASE_URL;
    this.pat = AZURE_DEVOPS_PAT;
  }

  private getHeaders() {
    const token = Buffer.from(`:${this.pat}`).toString("base64");
    return {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    };
  }

  private async testEndpoint(endpoint: string): Promise<TestResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        headers: this.getHeaders(),
      });
      return { endpoint, success: true, data: response.data };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        endpoint,
        success: false,
        error: axiosError.response?.status
          ? `HTTP ${axiosError.response.status}`
          : axiosError.message,
      };
    }
  }

  async testPermissions(): Promise<TestResult[]> {
    // Test project-independent endpoints first
    const globalEndpoints = [
      "_apis/projects?api-version=7.0",
      "_apis/git/repositories?api-version=7.0",
    ];

    // Project-scoped endpoints
    const projectEndpoints = [
      "_apis/teams?api-version=7.0&$top=100",
      "_apis/build/definitions?api-version=7.0",
      "_apis/release/definitions?api-version=7.0",
      "_apis/pipelines?api-version=7.0",
      "_apis/distributedtask/variablegroups?api-version=7.0",
      "_apis/serviceendpoint/endpoints?api-version=7.0",
    ];

    // First get global endpoints
    const globalResults = await Promise.all(
      globalEndpoints.map((e) => this.testEndpoint(e))
    );

    // Then get project-scoped endpoints for each project
    const projectResults: TestResult[] = [];
    const projectsResponse = globalResults.find((r) =>
      r.endpoint.includes("projects")
    );

    if (projectsResponse?.success && projectsResponse.data) {
      const projects = (projectsResponse.data as ProjectResponse).value;
      for (const project of projects) {
        const projectScoped = await Promise.all(
          projectEndpoints.map((e) => this.testEndpoint(`${project.id}/${e}`))
        );
        projectResults.push(...projectScoped);
      }
    }

    return [...globalResults, ...projectResults];
  }
}

async function main() {
  if (!AZURE_DEVOPS_BASE_URL || !AZURE_DEVOPS_PAT) {
    console.error(
      "Please set AZURE_DEVOPS_BASE_URL and AZURE_DEVOPS_PAT environment variables"
    );
    process.exit(1);
  }

  const tester = new DevOpsPATTester();
  const results = await tester.testPermissions();

  console.log("\nAzure DevOps PAT Permission Test Results:");
  console.log("----------------------------------------");

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const error = result.error ? ` (${result.error})` : "";
    console.log(`${status} ${result.endpoint}${error}`);

    // Add project listing for successful projects API call
    if (result.success && result.endpoint.includes("projects") && result.data) {
      const projects = (result.data as ProjectResponse).value;
      projects.forEach((project, index) => {
        const prefix = index === projects.length - 1 ? "└── " : "├── ";
        console.log(`    ${prefix}${project.name}`);
      });
    }
  });
}

main().catch(console.error);
