import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../shared/components/footer/footer';
import { Navbar } from '../../shared/components/navbar/navbar';
import { WhatsappBtn } from '../../shared/components/whatsapp-btn/whatsapp-btn';
import { SuccessPopup } from '../../shared/components/success-popup/success-popup';
import { SuccessPopupService } from '../../core/services/success-popup.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Footer, WhatsappBtn, SuccessPopup],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayout {
  isFoundingDay = environment.isFoundingDay;
  isNationalDay = environment.isNationalDay
  public successPopupService = inject(SuccessPopupService);
}
