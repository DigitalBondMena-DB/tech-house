
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API_END_POINTS } from '../constant/ApiEndPoints';

import { AboutResponse, BlogDetailsResponse, BlogsResponse, HomeResponse, JobDetailsResponse, JobsResponse, ProjectDetailsResponse, ProjectsResponse, ServicesResponse } from '../models/home.model';
import { ApiService } from './apiservice';


@Injectable({
  providedIn: 'root',
})
export class FeatureService {

  private apiService = inject(ApiService);

  // 🔹 Internal API Response Signal Reference
  private apiResponseSignal = signal<HomeResponse | null>(null);
  private aboutResponseSignal = signal<AboutResponse | null>(null);
  private servicesResponseSignal = signal<ServicesResponse | null>(null);
  private blogsResponseSignal = signal<BlogsResponse | null>(null);

  // 🔹 Home Data Signal (computed from API response)
  homeData = computed(() => this.apiResponseSignal());

  // 🔹 About Data Signal (computed from API response)
  aboutData = computed(() => this.aboutResponseSignal());

  // 🔹 Services Data Signal (computed from API response)
  servicesData = computed(() => this.servicesResponseSignal());

  // 🔹 Blogs Data Signal (computed from API response)
  blogsData = computed(() => this.blogsResponseSignal());

  // 🔹 Blog Details Signal
  private blogDetailsResponseSignal = signal<BlogDetailsResponse | null>(null);
  blogDetailsData = computed(() => this.blogDetailsResponseSignal());

  // 🔹 Projects Signal
  private projectsResponseSignal = signal<ProjectsResponse | null>(null);
  projectsData = computed(() => this.projectsResponseSignal());

  // 🔹 Project Details Signal
  projectDetailsResponseSignal = signal<ProjectDetailsResponse | null>(null);
  projectDetailsData = computed(() => this.projectDetailsResponseSignal());

  // 🔹 Jobs Signal
  private jobsResponseSignal = signal<JobsResponse | null>(null);
  jobsData = computed(() => this.jobsResponseSignal());

  // 🔹 Job Details Signal
  private jobDetailsResponseSignal = signal<JobDetailsResponse | null>(null);
  jobDetailsData = computed(() => this.jobDetailsResponseSignal());

  // =====================
  // HOME API - Optimized with Observable
  // =====================
  loadHomeData(): Observable<HomeResponse | null> {
    // Check if data already exists
    if (this.apiResponseSignal()) {
      return of(this.apiResponseSignal());
    }

    return this.apiService.get<HomeResponse>(API_END_POINTS.HOME).pipe(
      tap((data) => {
        if (data) {
          this.apiResponseSignal.set(data);
        }
      }),
      catchError((err) => {
        console.error('Error loading home data:', err);
        return of(null);
      })
    );
  }

  // =====================
  // Load Home Data (Legacy - for backward compatibility)
  // =====================
  loadHomeDataSync(): void {
    this.loadHomeData().subscribe();
  }

  // =====================
  // ABOUT API
  // =====================
  loadAboutData(): void {
    // Check if data already exists
    if (this.aboutResponseSignal()) {
      return;
    }

    this.apiService.get<AboutResponse>(API_END_POINTS.ABOUT).pipe(
      tap((data) => {
        if (data) {
          this.aboutResponseSignal.set(data);
        }
      }),
      catchError((err) => {
        console.error('Error loading about data:', err);
        return of(null);
      })
    ).subscribe();
  }

  // =====================
  // SERVICES API
  // =====================
  loadServicesData(): void {
    // Check if data already exists
    if (this.servicesResponseSignal()) {
      return;
    }

    this.apiService.get<ServicesResponse>(API_END_POINTS.SERVICES).pipe(
      tap((data) => {
        if (data) {
          this.servicesResponseSignal.set(data);
        }
      }),
      catchError((err) => {
        console.error('Error loading services data:', err);
        return of(null);
      })
    ).subscribe();
  }

  // =====================
  // BLOGS API
  // =====================
  loadBlogsData(page: number = 1): void {
    const endpoint = `${API_END_POINTS.BLOGS}?page=${page}`;
    
    this.apiService.get<BlogsResponse>(endpoint).pipe(
      tap((data) => {
        if (data) {
          this.blogsResponseSignal.set(data);
        }
      }),
      catchError((err) => {
        console.error('Error loading blogs data:', err);
        return of(null);
      })
    ).subscribe();
  }

  // =====================
  // BLOG DETAILS API
  // =====================
  loadBlogDetails(slug: string): void {
    const endpoint = API_END_POINTS.BLOG_DETAILS.replace('{slug}', slug);
    
    this.apiService.get<BlogDetailsResponse>(endpoint).pipe(
      tap((data) => {
        if (data) {
          this.blogDetailsResponseSignal.set(data);
        }
      }),
      catchError((err) => {
        console.error('Error loading blog details:', err);
        return of(null);
      })
    ).subscribe();
  }

  // =====================
  // PROJECTS API
  // =====================
  loadProjectsData(page: number = 1, slug?: string): void {
    let endpoint = `${API_END_POINTS.PROJECTS}?page=${page}`;
    if (slug) {
      endpoint = `/projects/${slug}?page=${page}`;
    }
    
    this.apiService.get<ProjectsResponse>(endpoint).pipe(
      tap((data) => {
        if (data) {
          this.projectsResponseSignal.set(data);
        }
      }),
      catchError((err) => {
        console.error('Error loading projects data:', err);
        return of(null);
      })
    ).subscribe();
  }

  // =====================
  // PROJECT DETAILS API
  // =====================
  loadProjectDetails(slug: string): void {
    // Reset previous data
    this.projectDetailsResponseSignal.set(null);
    
    // Decode the slug first in case it was double-encoded, then encode properly
    // Handle both encoded and unencoded slugs
    let cleanSlug = slug;
    try {
      // If slug is already encoded, decode it first
      if (slug.includes('%')) {
        cleanSlug = decodeURIComponent(slug);
      }
    } catch (e) {
      // If decoding fails, use the original slug
      cleanSlug = slug;
    }
    
    // Remove spaces from the slug
    cleanSlug = cleanSlug.replace(/\s+/g, '');
    
    
    // Encode the slug to handle Arabic characters
    // Use encodeURIComponent which properly handles special characters
    const encodedSlug = encodeURIComponent(cleanSlug);
    const endpoint = API_END_POINTS.PROJECT_DETAILS.replace('{slug}', encodedSlug);
    
    // Try both response types - sometimes API might return different structure
    this.apiService.get<any>(endpoint).pipe(
      tap((data) => {
        if (data) {
          // Check if it's ProjectDetailsResponse (has project property)
          if (data.project) {
            this.projectDetailsResponseSignal.set(data as ProjectDetailsResponse);
          }
          // Check if it's ProjectsResponse (has projects array) - extract the matching project
          else if (data.projects && Array.isArray(data.projects.data)) {
            const projectItem = data.projects.data.find((p: any) => p.slug === slug);
            if (projectItem) {
              this.projectDetailsResponseSignal.set({
                project: projectItem as any
              } as ProjectDetailsResponse);
            } else {
              this.projectDetailsResponseSignal.set(null);
            }
          }
          // If data has project at root level (direct project object)
          else if (data.id && data.slug) {
            this.projectDetailsResponseSignal.set({
              project: data
            } as ProjectDetailsResponse);
          }
          else {
            this.projectDetailsResponseSignal.set(null);
          }
        }
      }),
      catchError((err) => {
        console.error('Error loading project details:', err);
        this.projectDetailsResponseSignal.set(null);
        return of(null);
      })
    ).subscribe();
  }

  // =====================
  // JOBS API
  // =====================
  loadJobsData(categoryId?: number): void {
    let endpoint = API_END_POINTS.JOBS;
    if (categoryId) {
      endpoint = API_END_POINTS.JOB_BY_CATEGORY.replace('{category_id}', categoryId.toString());
    }
    
    this.apiService.get<JobsResponse>(endpoint).pipe(
      tap((data) => {
        if (data) {
          this.jobsResponseSignal.set(data);
        }
      }),
      catchError((err) => {
        console.error('Error loading jobs data:', err);
        return of(null);
      })
    ).subscribe();
  }

  // =====================
  // JOB DETAILS API
  // =====================
  loadJobDetails(slug: string): void {
    // Reset previous data
    this.jobDetailsResponseSignal.set(null);
    
    // Encode the slug to handle Arabic characters
    const encodedSlug = encodeURIComponent(slug);
    const endpoint = API_END_POINTS.JOB_DETAILS.replace('{slug}', encodedSlug);
    
    this.apiService.get<JobDetailsResponse>(endpoint).pipe(
      tap((data) => {
        if (data) {
          this.jobDetailsResponseSignal.set(data);
        }
      }),
      catchError((err) => {
        console.error('Error loading job details:', err);
        return of(null);
      })
    ).subscribe();
  }

  // =====================
  // SUBMIT JOB APPLICATION
  // =====================
  submitJobApplication(formData: FormData) {
    return this.apiService.post<any>(API_END_POINTS.SUBMIT_JOB_FORM, formData);
  }
}