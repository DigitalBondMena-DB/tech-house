import { CommonModule } from '@angular/common';
import {  Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import {  RouterLink, ActivatedRoute } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { SharedPaginationComponent } from '../../shared/components/shared-pagination/shared-pagination';
import { FeatureService } from '../../core/services/featureService';
import { SharedFeatureService } from '../../core/services/sharedFeatureService';
import { ContactUsSec } from '../../shared/components/contact-us-sec/contact-us-sec';
import { HeroSection } from '../../shared/components/hero-section/hero-section';

@Component({
  selector: 'app-projects',
  imports: [
    CommonModule,
    HeroSection,
    ContactUsSec,
    SharedPaginationComponent,
    SkeletonModule,
    RouterLink
],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects implements OnInit {
  private featureService = inject(FeatureService);
  private sharedFeatureService = inject(SharedFeatureService);
  private route = inject(ActivatedRoute);
  
  projectsData = computed(() => this.featureService.projectsData());
  bannerSection = computed(() => this.projectsData()?.bannerSection ?? null);
  projects = computed(() => this.projectsData()?.projects ?? null);
  projectItems = computed(() => this.projects()?.data ?? []);

  // Selected service slug for filtering
  selectedSlug = signal<string | null>(null);

  // Pagination state
  rows = signal(9);
  totalRecords = computed(() => this.projects()?.total ?? 0);
  currentPage = computed(() => this.projects()?.current_page ?? 1);
  totalPages = computed(() => this.projects()?.last_page ?? 1);
  first = computed(() => (this.currentPage() - 1) * this.rows());

  // Arrow rotation angle
  arrowRotation = signal(0);
  selectedIndex = signal<number | null>(null);
  arrowPosition = signal(0);

  // 🔹 Check if all sections are loaded (contact will only show when all sections are loaded)
  isAllDataLoaded = computed(() => {
    if (!this.bannerSection()) return false;
    if (!this.projectItems()?.length) return false;
    return true;
  });


  ngOnInit(): void {
    this.sharedFeatureService.loadServicesSection();
    this.route.queryParams.subscribe(params => {
      const page = params['page'] ? parseInt(params['page'], 10) : 1;
      this.loadProjects(page, this.selectedSlug());
    });
  }

  loadProjects(page: number, slug?: string | null): void {
    this.featureService.loadProjectsData(page, slug || undefined);
  }


}
