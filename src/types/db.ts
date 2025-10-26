export interface DbResponse<T> {
  data: T | null;
  error: { message: string; [key: string]: any } | null;
}

export interface IDbService {
  getProfile(userId: string): Promise<DbResponse<any>>;
  createProfile(profileData: any): Promise<DbResponse<any>>;
  updateProfile(userId: string, updates: any): Promise<DbResponse<any>>;
  getTalent(profileId: string): Promise<DbResponse<any>>;
  createTalent(talentData: any): Promise<DbResponse<any>>;
  updateTalent(talentId: string, updates: any): Promise<DbResponse<any>>;
  getCompany(profileId: string): Promise<DbResponse<any>>;
  createCompany(companyData: any): Promise<DbResponse<any>>;
  updateCompany(profileId: string, updates: any): Promise<DbResponse<any>>;
  getMatches(filters: any): Promise<DbResponse<any[]>>;
  getApplications(filters: any): Promise<DbResponse<any[]>>;
  getAnalytics(userId: string, type: string): Promise<DbResponse<any>>;
  createJob(jobData: any): Promise<DbResponse<any>>;
  getJobs(filters: any): Promise<DbResponse<any[]>>;
  updateJob(jobId: string, updates: any): Promise<DbResponse<any>>;
  deleteJob(jobId: string): Promise<{ error: any }>;
}
