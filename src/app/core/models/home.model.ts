/**
 * Home API Response Models
 * Following Angular best practices with proper TypeScript interfaces
 */

/**
 * Image object with responsive variants
 */
export interface ResponsiveImage {
  desktop: string;
  tablet: string;
  mobile: string;
}

/**
 * Hero Section Data
 */
export interface HeroSection {
  title: string;
  input_title: string;
  scroll_title: string;
  paragraph?: string;
  image: ResponsiveImage;
}

/**
 * About Home Section Data
 */
export interface AboutHome {
  title: string;
  text: string;
  image: ResponsiveImage;
}

/**
 * Service Item
 */
export interface Service {
  title: string;
  slug: string;
  is_active: boolean;
  image: ResponsiveImage;
}

/**
 * Project Item
 */
export interface Project {
  title: string;
  category_name: string;
  text: string;
  slug: string;
  is_active: boolean;
  image: ResponsiveImage;
}

/**
 * Testimonial Item
 */
export interface Testimonial {
  title: string;
  name: string;
  text: string;
  image: ResponsiveImage;
}

/**
 * Blog Item
 */
export interface Blog {
  title: string;
  slug: string;
  published_at: string;
  publish_at_ar: string;
  image: ResponsiveImage;
  blog_hover?: ResponsiveImage;
}

/**
 * CTA Section Data
 */
export interface CTASection {
  title: string;
  video: string;
}

/**
 * Counter Item
 */
export interface Counter {
  count: number;
  title: string;
}

/**
 * Counters API Response
 */
export interface CountersResponse {
  counters: Counter[];
}

/**
 * Complete Home API Response
 */
export interface HomeResponse {
  heroSection: HeroSection;
  aboutHome: AboutHome;
  services: Service[];
  projects: Project[];
  testimonials: Testimonial[];
  blogs: Blog[];
  ctasection?: CTASection;
}

/**
 * Footer Link Item
 */
export interface FooterLink {
  title: string;
  url: string;
}

/**
 * Footer Section
 */
export interface FooterSection {
  title: string;
  links: FooterLink[];
}

/**
 * Contact Us Data (for Footer)
 */
export interface ContactUsData {
  logo?: ResponsiveImage;
  description?: string;
  footer_text?: string;
  working_hours?: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  address?: string;
  image?: ResponsiveImage; // Image for contact section
  companySection?: FooterSection;
  solutionsSection?: FooterSection;
  copyright?: string;
  privacyPolicyUrl?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  social?: {
    map_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    linkedin_url?: string;
    tiktok_url?: string;
    snapchat_url?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

/**
 * Contact Us API Response
 */
export interface ContactUsResponse {
  contactUs: ContactUsData;
}

/**
 * Service Title Item (for Footer)
 */
export interface ServiceTitle {
  title: string;
  slug: string;
  url?: string;
}

/**
 * Services Section API Response
 */
export interface ServicesSectionResponse {
  services?: ServiceTitle[];
  titles?: ServiceTitle[];
}

/**
 * Client/Partner Item
 */
export interface ClientPartner {
  title: string;
  url: string | null;
  is_active: boolean;
  order: number;
  image: ResponsiveImage;
}

/**
 * Partners/Clients API Response
 */
export interface PartnersClientsResponse {
  clients: ClientPartner[];
  partners: ClientPartner[];
}

/**
 * Privacy Policy Section Item
 */
export interface PrivacyPolicySection {
  title: string;
  content: string[];
}

/**
 * Banner Section Data
 */
export interface BannerSection {
  small_title?: string;
  title: string;
  text?: string;
  meta_title?: string;
  meta_description?: string;
  image: ResponsiveImage;
}

/**
 * Privacy Policy Content
 */
export interface PrivacyPolicyContent {
  title: string;
  text?: string;
}

/**
 * Privacy Policy Data
 */
export interface PrivacyPolicyData {
  title: string;
  paragraph?: string;
  image: ResponsiveImage;
  sections?: PrivacyPolicySection[];
  bannerSection?: BannerSection;
  privacyPolicy?: PrivacyPolicyContent;
}

/**
 * Privacy Policy API Response
 */
export interface PrivacyPolicyResponse {
  privacyPolicy?: PrivacyPolicyData | PrivacyPolicyContent;
  title?: string;
  paragraph?: string;
  image?: ResponsiveImage;
  sections?: PrivacyPolicySection[];
  bannerSection?: BannerSection;
}

/**
 * About Section Item
 */
export interface AboutSection {
  title: string;
  text: string;
  image: ResponsiveImage;
  order: number;
  is_active: boolean;
}

/**
 * About Information
 */
export interface AboutInformation {
  title: string;
  text: string;
}

/**
 * About API Response
 */
export interface AboutResponse {
  bannerSection: BannerSection;
  aboutInformation: AboutInformation;
  aboutSection: AboutSection[];
}

/**
 * Contact Hero Section Data
 */
export interface ContactHero {
  title: string;
  paragraph?: string;
  image: ResponsiveImage;
}

/**
 * Contact Hero API Response
 */
export interface ContactHeroResponse {
  bannerSection?: {
    title?: string;
    text?: string;
    image?: ResponsiveImage;
  };
  contactHero?: ContactHero;
  title?: string;
  paragraph?: string;
  image?: ResponsiveImage;
}

/**
 * Service Detail Item
 */
export interface ServiceDetail {
  title: string;
  text: string;
  is_active: boolean;
  image: ResponsiveImage;
  keywords: string[];
}

/**
 * Services API Response
 */
export interface ServicesResponse {
  bannerSection: BannerSection;
  services: ServiceDetail[];
}

/**
 * Blog Item for Blogs Page
 */
export interface BlogItem {
  id: number;
  title: string;
  small_text: string;
  slug: string;
  publish_at_ar: string;
  image: ResponsiveImage;
}

/**
 * Pagination Link
 */
export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

/**
 * Blogs Pagination Data
 */
export interface BlogsPaginationData {
  current_page: number;
  data: BlogItem[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * Blogs API Response
 */
export interface BlogsResponse {
  bannerSection: BannerSection;
  blogs: BlogsPaginationData;
}

/**
 * Blog Detail Item
 */
export interface BlogDetail {
  title: string;
  small_text: string;
  text: string; // HTML content
  slug: string;
  publish_at_ar: string;
  image: string[]; // Array of 3 image URLs [mobile, tablet, desktop]
  banner_image: string | string[] | null; // Banner image URL (string or array)
  meta_title: string;
  meta_description: string;
  faq_schema: any | null;
}

/**
 * Related Blog Item
 */
export interface RelatedBlog {
  title: string;
  small_text: string;
  slug: string;
  publish_at_ar: string;
  image: ResponsiveImage;
}

/**
 * Blog Details API Response
 */
export interface BlogDetailsResponse {
  blog: BlogDetail;
  related_blogs: RelatedBlog[];
}

/**
 * Project Item for Projects Page
 */
export interface ProjectItem {
  id: number;
  title: string;
  brief: string;
  slug: string;
  is_active: boolean;
  image: ResponsiveImage;
  types: string[];
}

/**
 * Projects Pagination Data
 */
export interface ProjectsPaginationData {
  current_page: number;
  data: ProjectItem[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * Projects API Response
 */
export interface ProjectsResponse {
  bannerSection: BannerSection;
  projects: ProjectsPaginationData;
}

/**
 * Project Detail Item
 */
/**
 * Project Image Item
 */
export interface ProjectImage {
  id: number;
  project_id: number;
  main_image: string;
  is_active: boolean;
}

export interface ProjectDetail {
  id: number;
  title: string;
  brief: string;
  text: string;
  is_active: boolean;
  slug: string;
  category_name: string;
  year_creation: string;
  client_name: string;
  service_id: number;
  meta_title: string;
  meta_description: string;
  image: ResponsiveImage;
  banner_image: ResponsiveImage | null;
  logo: ResponsiveImage;
  project_types: any[];
  project_information: any[];
  project_technologies: any[];
  project_images: ProjectImage[];
  projects_sections: any[];
}

/**
 * Project Details API Response
 */
export interface ProjectDetailsResponse {
  project: ProjectDetail;
}

/**
 * Job Item for Jobs Page
 */
export interface JobItem {
  id: number;
  job_category_id: number;
  title: string;
  brief?: string;
  slug: string;
  is_active: boolean;
}

/**
 * Job Category Item
 */
export interface JobCategory {
  id: number;
  title: string;
  jobs_count: number;
  jobs: JobItem[];
}

/**
 * Jobs API Response
 */
export interface JobsResponse {
  bannerSection: BannerSection;
  jobCategories: JobCategory[];
}

/**
 * Job Section
 */
export interface JobSection {
  id: number;
  job_information_id: number;
  title: string;
  text: string;
  order: number;
  is_active: boolean;
}

/**
 * Job Category for Job Details
 */
export interface JobCategoryDetail {
  id: number;
  title: string;
}

/**
 * Job Details
 */
export interface JobDetail {
  id: number;
  title: string;
  brief?: string;
  text: string;
  working_hours?: string;
  working_location?: string;
  working_experience?: string;
  meta_title?: string;
  meta_description?: string;
  published_at?: string | null;
  faq_schema?: string;
  is_active: boolean;
  slug: string;
  job_category_id: number;
  job_sections?: JobSection[];
  job_category?: JobCategoryDetail;
}

/**
 * Job Details API Response
 */
export interface JobDetailsResponse {
  job: JobDetail;
}

