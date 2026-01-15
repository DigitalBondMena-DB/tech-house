import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { filter } from 'rxjs/operators';
import { API_END_POINTS } from '../../../core/constant/ApiEndPoints';
import { AppButton } from '../app-button/app-button';
import { SectionTitle } from '../section-title/section-title';
import { SuccessPopup } from '../success-popup/success-popup';
import { COUNTRIES } from './models/countries';
import { Country } from './models/country.model';

@Component({
  selector: 'app-contact-us-sec',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SectionTitle, 
    InputTextModule,
    TextareaModule,
    InputGroupModule,
    InputGroupAddonModule,
    SelectModule,
    FloatLabelModule,
    AppButton,
    SuccessPopup
  ],
  templateUrl: './contact-us-sec.html',
  styleUrl: './contact-us-sec.css'
})
export class ContactUsSec implements OnInit {
  // Contact Us Section Data
  contactTitle = "تواصل معنا";
  contactSubtitle = "نجاحك الرقمي يبدأ بخطوة معنا، بداية تصنع الفرق.";
  BtnText = "إرسال";

  // Countries List
  countries = COUNTRIES;

  // Selected Country - Initialize with Saudi Arabia as default (use exact reference from array)
  selectedCountryModel: Country = COUNTRIES[0];
  
  // Selected Country Signal (syncs with model) - Initialize with Saudi Arabia
  selectedCountry = signal<Country>(COUNTRIES[0]);

  // Computed values
  selectedDialCode = computed(() => this.selectedCountry()?.dialCode || '+966');
  selectedCountryCode = computed(() => this.selectedCountry()?.code || 'sa');
  
  // Phone patterns for each country (regex patterns)
  private phonePatterns: { [key: string]: { pattern: RegExp; minLength: number; maxLength: number; placeholder: string } } = {
    'sa': { pattern: /^5[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '5XX XXX XXXX' },
    'eg': { pattern: /^1[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '1XXX XXX XXXX' },
    'ae': { pattern: /^5[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '5X XXX XXXX' },
    'kw': { pattern: /^5[0-9]{7}$/, minLength: 8, maxLength: 8, placeholder: '5XXX XXXX' },
    'qa': { pattern: /^3[0-9]{7}$/, minLength: 8, maxLength: 8, placeholder: '3XXX XXXX' },
    'bh': { pattern: /^3[0-9]{7}$/, minLength: 8, maxLength: 8, placeholder: '3XXX XXXX' },
    'om': { pattern: /^9[0-9]{7}$/, minLength: 8, maxLength: 8, placeholder: '9XXX XXXX' },
    'jo': { pattern: /^7[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '7X XXX XXXX' },
    'lb': { pattern: /^3[0-9]{6}$/, minLength: 7, maxLength: 7, placeholder: '3X XXX XXX' },
    'sy': { pattern: /^9[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '9XXX XXX XXX' },
    'iq': { pattern: /^7[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '7XX XXX XXXX' },
    'ye': { pattern: /^7[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '7XX XXX XXX' },
    'ma': { pattern: /^6[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '6XX XXX XXX' },
    'dz': { pattern: /^5[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '5XX XX XX XX' },
    'tn': { pattern: /^2[0-9]{7}$/, minLength: 8, maxLength: 8, placeholder: '2X XXX XXX' },
    'ly': { pattern: /^9[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '9X XXX XXXX' },
    'sd': { pattern: /^9[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '9XX XXX XXXX' },
    'us': { pattern: /^[2-9][0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '(XXX) XXX-XXXX' },
    'gb': { pattern: /^7[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '7XXX XXXXXX' },
    'ca': { pattern: /^[2-9][0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '(XXX) XXX-XXXX' },
    'au': { pattern: /^4[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '4XX XXX XXX' },
    'fr': { pattern: /^6[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '6 XX XX XX XX' },
    'de': { pattern: /^1[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '1XX XXXXXXX' },
    'it': { pattern: /^3[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '3XX XXX XXXX' },
    'es': { pattern: /^6[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '6XX XXX XXX' },
    'in': { pattern: /^[6-9][0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '9XXXX XXXXX' },
    'cn': { pattern: /^1[3-9][0-9]{9}$/, minLength: 11, maxLength: 11, placeholder: '1XX XXXX XXXX' },
    'jp': { pattern: /^[789]0[0-9]{8}$/, minLength: 11, maxLength: 11, placeholder: '90-XXXX-XXXX' },
    'kr': { pattern: /^1[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '10-XXXX-XXXX' },
    'ru': { pattern: /^9[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '9XX XXX-XX-XX' },
    'tr': { pattern: /^5[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '5XX XXX XX XX' },
    'ir': { pattern: /^9[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '9XX XXX XXXX' },
    'pk': { pattern: /^3[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '3XX-XXXXXXX' },
    'bd': { pattern: /^1[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '1XXX-XXXXXX' },
    'id': { pattern: /^8[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '8XX-XXXX-XXXX' },
    'my': { pattern: /^1[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '1X-XXX XXXX' },
    'sg': { pattern: /^9[0-9]{7}$/, minLength: 8, maxLength: 8, placeholder: '9XXXX XXX' },
    'th': { pattern: /^8[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '8X-XXX-XXXX' },
    'ph': { pattern: /^9[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '9XX XXX XXXX' },
    'vn': { pattern: /^9[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '9X XXXX XXXX' },
    'za': { pattern: /^[6-9][0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: 'XX XXX XXXX' },
    'ng': { pattern: /^8[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '8XX XXX XXXX' },
    'ke': { pattern: /^7[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '7XX XXX XXX' },
    'br': { pattern: /^[1-9][0-9]{10}$/, minLength: 11, maxLength: 11, placeholder: '(XX) XXXXX-XXXX' },
    'ar': { pattern: /^1[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '11 XXXX-XXXX' },
    'mx': { pattern: /^5[0-9]{9}$/, minLength: 10, maxLength: 10, placeholder: '55 XXXX XXXX' },
    'cl': { pattern: /^9[0-9]{8}$/, minLength: 9, maxLength: 9, placeholder: '9 XXXX XXXX' }
  };

  // Phone placeholder based on selected country
  phonePlaceholder = computed(() => {
    const country = this.selectedCountry();
    const phoneInfo = this.phonePatterns[country?.code || 'sa'];
    return phoneInfo?.placeholder || 'XXXXXXXXXX';
  });

  // Form using ReactiveForms with signals
  contactForm!: FormGroup;
  fullNameControl!: AbstractControl;
  emailControl!: AbstractControl;
  phoneControl!: AbstractControl;
  messageControl!: AbstractControl;

  // HTTP Client
  private http = inject(HttpClient);
  // private readonly baseUrl = environment.apiUrl;
  // Contact form uses different API domain
  private readonly contactApiUrl = 'https://api.techhouseksa.com/api';

  // Form submission state
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);
  showSuccessPopup = signal(false);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Ensure default value is properly set (Saudi Arabia is first in COUNTRIES array)
    this.selectedCountryModel = COUNTRIES[0];
    this.selectedCountry.set(COUNTRIES[0]);
    this.initializeForm();
    
    // Check if URL contains "/done" and show popup if it does
    this.checkUrlForDone();
    
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkUrlForDone();
    });
  }
  
  private checkUrlForDone(): void {
    const currentUrl = this.router.url.split('?')[0];
    if (currentUrl.endsWith('/done')) {
      this.showSuccessPopup.set(true);
    }
  }
  
  private initializeForm() {
    // Custom validator for name (only letters, no numbers or symbols)
    const nameValidator = (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null; // Let required validator handle empty values
      }
      const namePattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z\s]+$/;
      if (!namePattern.test(control.value)) {
        return { invalidName: true };
      }
      return null;
    };
    
    // Custom validator for phone based on selected country
    const phoneValidator = (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null; // Let required validator handle empty values
      }
      
      // First check if it's only numbers
      const phonePattern = /^[0-9]+$/;
      if (!phonePattern.test(control.value)) {
        return { invalidPhone: true };
      }
      
      // Get current country pattern
      const countryCode = this.selectedCountryCode();
      const phoneInfo = this.phonePatterns[countryCode];
      
      if (!phoneInfo) {
        return { invalidCountry: true };
      }
      
      // Check length first - this is the most important validation
      const phoneLength = control.value.length;
      if (phoneLength < phoneInfo.minLength) {
        return { 
          invalidLength: { 
            requiredLength: phoneInfo.minLength, 
            maxLength: phoneInfo.maxLength,
            actualLength: phoneLength,
            type: 'min'
          } 
        };
      }
      
      if (phoneLength > phoneInfo.maxLength) {
        return { 
          invalidLength: { 
            requiredLength: phoneInfo.minLength, 
            maxLength: phoneInfo.maxLength,
            actualLength: phoneLength,
            type: 'max'
          } 
        };
      }
      
      // Check pattern match (format validation)
      if (!phoneInfo.pattern.test(control.value)) {
        return { 
          invalidFormat: { 
            country: this.selectedCountry()?.name || 'المختارة',
            requiredLength: phoneInfo.minLength
          } 
        };
      }
      
      return null;
    };

    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required, nameValidator]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phone: ['', [Validators.required, phoneValidator]],
      message: ['', [Validators.required]]
    });

    this.fullNameControl = this.contactForm.get('fullName')!;
    this.emailControl = this.contactForm.get('email')!;
    this.phoneControl = this.contactForm.get('phone')!;
    this.messageControl = this.contactForm.get('message')!;
  }

  // Handle Country Selection
  onCountryChange(country: Country) {
    if (country) {
      this.selectedCountry.set(country);
      this.selectedCountryModel = country;
      
      // Re-validate phone number when country changes
      if (this.phoneControl) {
        this.phoneControl.updateValueAndValidity();
        // Clear phone field when country changes to prevent invalid formats
        this.phoneControl.setValue('');
      }
    }
  }
  
  // Prevent numbers and symbols in name field
  onNameKeyPress(event: KeyboardEvent): boolean {
    const char = String.fromCharCode(event.which || event.keyCode);
    // Allow Arabic letters, English letters, and spaces
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const englishPattern = /[a-zA-Z\s]/;
    const isAllowed = arabicPattern.test(char) || englishPattern.test(char);
    
    if (!isAllowed) {
      event.preventDefault();
      return false;
    }
    return true;
  }
  
  // Prevent letters in phone field
  onPhoneKeyPress(event: KeyboardEvent): boolean {
    const char = String.fromCharCode(event.which || event.keyCode);
    // Only allow numbers
    const numberPattern = /[0-9]/;
    
    if (!numberPattern.test(char)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Submit Contact Form
  onSubmit() {
    if (this.contactForm.valid) {
      // Create FormData object to match API requirements
      const formData = new FormData();
      formData.append('name', this.contactForm.value.fullName);
      formData.append('email', this.contactForm.value.email);
      formData.append('phone', this.contactForm.value.phone); // Phone without dial code
      formData.append('message', this.contactForm.value.message);
      
      // Reset previous states
      this.isSubmitting.set(true);
      this.submitSuccess.set(false);
      this.submitError.set(null);
      
      // Submit to API (using different domain for contact form)
      this.http.post(`${this.contactApiUrl}${API_END_POINTS.SUBMIT_CONTACT_FORM}`, formData).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.submitSuccess.set(true);
          // Reset form after successful submission
          this.contactForm.reset();
          // Show success popup
          this.showSuccessPopup.set(true);
          // Add "done" to the route path using Location API
          const currentUrl = this.location.path().split('?')[0];
          if (!currentUrl.endsWith('/done')) {
            const queryParams = this.router.parseUrl(this.router.url).queryParams;
            const queryString = Object.keys(queryParams).length > 0 
              ? '?' + new URLSearchParams(queryParams as any).toString() 
              : '';
            this.location.replaceState(currentUrl + '/done' + queryString);
          }
        },
        error: (error) => {
          this.isSubmitting.set(false);
          let errorMessage = 'حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.';
          
          // Handle different error types
          if (error.status === 0) {
            // Network error or CORS issue
            if (error.error instanceof ProgressEvent && error.error.type === 'error') {
              errorMessage = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت أو المحاولة لاحقاً.';
            } else {
              errorMessage = 'حدث خطأ في الاتصال. قد تكون هناك مشكلة في CORS أو الخادم غير متاح.';
            }
          } else if (error.status === 404) {
            errorMessage = 'الـ endpoint غير موجود. يرجى التحقق من إعدادات الـ API.';
          } else if (error.status === 400) {
            errorMessage = error?.error?.message || 'البيانات المرسلة غير صحيحة. يرجى التحقق من الحقول.';
          } else if (error.status === 500) {
            errorMessage = 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          this.submitError.set(errorMessage);
          console.error('Contact form submission error:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error,
            message: error.message
          });
          // Clear error message after 8 seconds for network errors
          setTimeout(() => {
            this.submitError.set(null);
          }, 8000);
        }
      });
    } else {
      // Mark all fields as touched to show errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }
  
  // Helper methods to get error messages
  getFullNameError(): string | null {
    const control = this.fullNameControl;
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'الاسم الكامل مطلوب';
      if (control.errors['invalidName']) return 'الاسم يجب أن يحتوي على حروف فقط بدون أرقام أو رموز';
    }
    return null;
  }
  
  getEmailError(): string | null {
    const control = this.emailControl;
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'البريد الإلكتروني مطلوب';
      if (control.errors['email']) return 'البريد الإلكتروني غير صحيح';
      if (control.errors['pattern']) return 'صيغة البريد الإلكتروني غير صحيحة';
    }
    return null;
  }
  
  getPhoneError(): string | null {
    const control = this.phoneControl;
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'رقم الجوال مطلوب';
      if (control.errors['invalidPhone']) return 'رقم الجوال يجب أن يحتوي على أرقام فقط';
      if (control.errors['invalidCountry']) return 'الدولة المختارة غير مدعومة';
      if (control.errors['invalidLength']) {
        const error = control.errors['invalidLength'];
        return `رقم الجوال يجب أن يكون ${error.requiredLength} أرقام (${error.actualLength} رقم تم إدخاله)`;
      }
      if (control.errors['invalidFormat']) {
        const error = control.errors['invalidFormat'];
        return `رقم الجوال لا يطابق تنسيق ${error.country}. يرجى إدخال رقم صحيح`;
      }
    }
    return null;
  }
  
  getMessageError(): string | null {
    const control = this.messageControl;
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'الرسالة مطلوبة';
    }
    return null;
  }

  onClosePopup(): void {
    this.showSuccessPopup.set(false);
    // Remove "done" from the route path using Location API
    const currentUrl = this.location.path().split('?')[0];
    if (currentUrl.endsWith('/done')) {
      const baseUrl = currentUrl.replace('/done', '');
      const queryParams = this.router.parseUrl(this.router.url).queryParams;
      const queryString = Object.keys(queryParams).length > 0 
        ? '?' + new URLSearchParams(queryParams as any).toString() 
        : '';
      this.location.replaceState(baseUrl + queryString);
    }
  }
}
