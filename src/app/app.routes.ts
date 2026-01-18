import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
    {
        path: '', component: MainLayout,
        children: [
            {
                path: '', loadComponent: () => import('./features/home/home').then(m => m.Home)
            },
            {
                path: 'من-نحن', loadComponent: () => import('./features/about-us/about-us').then(m => m.AboutUs
                )
            },
            {
                path: 'الخدمات', loadComponent: () => import('./features/services/services').then(m => m.Services
                )
            },
            {
                path: 'المشاريع', loadComponent: () => import('./features/projects/projects').then(m => m.Projects
                )
            },
            {
                path: 'الوظائف', loadComponent: () => import('./features/jops/jops').then(m => m.Jops
                )
            },
            {
                path: 'المقالات', loadComponent: () => import('./features/blogs/blogs').then(m => m.Blogs
                )
            },
            {
                path: 'اتصل-بنا/تم', loadComponent: () => import('./features/contact-us/contact-us').then(m => m.ContactUs
                )
            },
            {
                path: 'اتصل-بنا', loadComponent: () => import('./features/contact-us/contact-us').then(m => m.ContactUs
                )
            },
            {
                path: 'سياسة-الخصوصية', loadComponent: () => import('./features/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy
                )
            },

            {
                path: 'الخدمات/:slug', loadComponent: () => import('./features/service-det/service-det').then(m => m.ServiceDet
                )
            },

            {
                path: 'المشاريع/:slug', loadComponent: () => import('./features/project-det/project-det').then(m => m.ProjectDet
                )
            },
            {
                path: 'المقالات/:slug', loadComponent: () => import('./features/blog-det/blog-det').then(m => m.BlogDet
                )
            },
            {
                path: 'الوظائف/:slug/تم', loadComponent: () => import('./features/jop-det/jop-det').then(m => m.JopDet
                )
            },
            {
                path: 'الوظائف/:slug', loadComponent: () => import('./features/jop-det/jop-det').then(m => m.JopDet
                )
            },
            { path: '**', redirectTo: '', pathMatch: 'full' },
        ]
    }
];
