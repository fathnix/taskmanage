import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Logo, LogoMark } from '@/components/Logo';
import {
  ArrowRightIcon,
  Bars3Icon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CommandLineIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XMarkIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  BellAlertIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  EyeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export function Landing() {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'qa' | 'analytics' | 'roles'>('tasks');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const faqs = [
    {
      q: 'Apa yang membuat FlowTrack berbeda dari sistem manajemen tugas biasa?',
      a: 'FlowTrack bukan sekadar to-do list biasa. Kami menyematkan alur kerja Quality Assurance (QA) dan Persetujuan (Approval) berlapis langsung di dalam pipeline tugas. Sebuah tugas tidak bisa langsung dianggap selesai sebelum diverifikasi oleh tim QA dan disetujui Project Manager. Ini menjamin standar kualitas tertinggi tanpa risiko human error.',
    },
    {
      q: 'Apakah FlowTrack bisa digunakan secara gratis?',
      a: 'Ya, Anda bisa mendaftar dan menggunakan paket Starter FlowTrack secara gratis selamanya untuk tim kecil hingga 5 anggota dengan proyek tak terbatas. Kami juga memberikan uji coba gratis 14 hari untuk fitur Enterprise tanpa perlu kartu kredit.',
    },
    {
      q: 'Bagaimana peran pengguna (User Roles) diatur di dalam sistem?',
      a: 'FlowTrack memiliki sistem kontrol hak akses berbasis peran (RBAC) yang sangat ketat: Admin (kontrol penuh organisasi), Project Manager (membuat proyek, menugaskan task, menyetujui approval), Member / Tim Pelaksana (eksekusi tugas & submit penyelesaian), serta QA Reviewer (menguji & memvalidasi hasil kerja).',
    },
    {
      q: 'Apakah data proyek dan privasi tim kami aman?',
      a: 'Keamanan adalah prioritas utama kami. Seluruh komunikasi data dienkripsi dengan standar TLS 1.3 dan AES-256. Sistem kami juga dilengkapi audit trail transparan untuk memantau setiap perubahan status tugas dan riwayat revisi.',
    },
    {
      q: 'Berapa lama waktu yang dibutuhkan untuk onboarding tim baru?',
      a: 'Kurang dari 3 menit! Antarmuka FlowTrack dirancang sangat bersih dan intuitif. Begitu mendaftar, Anda dapat langsung mengundang anggota tim, membuat proyek pertama, dan membagi tugas tanpa perlu pelatihan teknis yang rumit.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-neutral-900 selection:bg-primary-500 selection:text-white">
      {/* Ambient background glow accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-primary-200/40 via-pastel-blue-200/30 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-pastel-green-100/50 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-[1600px] -right-40 w-[600px] h-[600px] bg-pastel-blue-100/50 rounded-full blur-3xl opacity-50" />
      </div>

      {/* ===================== NAVBAR ===================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-neutral-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <LogoMark className="h-10 w-10 rounded-xl group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-1.5">
                  FlowTrack
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200">
                    Pro
                  </span>
                </span>
                <span className="text-xs text-neutral-500 font-medium">Smart Project Management</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#fitur"
                className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Fitur Unggulan
              </a>
              <a
                href="#workflow"
                className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Alur QA & Approval
              </a>
              <a
                href="#solusi"
                className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Mengapa FlowTrack?
              </a>
              <a
                href="#testimoni"
                className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Testimoni
              </a>
              <a
                href="#harga"
                className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Harga
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm"
                >
                  <Squares2X2Icon className="w-4 h-4 text-primary-400" />
                  <span>Halo, {user?.name?.split(' ')[0] || 'User'} (Ke Dashboard)</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all"
                  >
                    <span>Daftar Gratis</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-neutral-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-600"
            >
              Fitur Unggulan
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-600"
            >
              Alur QA & Approval
            </a>
            <a
              href="#solusi"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-600"
            >
              Mengapa FlowTrack?
            </a>
            <a
              href="#testimoni"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-600"
            >
              Testimoni
            </a>
            <a
              href="#harga"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-600"
            >
              Harga
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-600"
            >
              FAQ
            </a>
            <div className="pt-4 border-t border-neutral-200 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full text-center py-3 rounded-xl bg-neutral-900 text-white font-semibold shadow-sm"
                >
                  Buka Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center py-2.5 rounded-xl border border-neutral-200 text-neutral-800 font-semibold hover:bg-neutral-50"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-md shadow-primary-500/25"
                  >
                    Daftar Gratis Sekarang
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header Content */}
          <div className="text-center max-w-3xl mx-auto">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs sm:text-sm font-semibold shadow-sm mb-6 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
              <span>Platform Manajemen Proyek & Validasi QA Generasi Baru</span>
            </div>

            {/* Main Punchy Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.15] mb-6">
              Kelola Proyek Lebih Cepat, Rapi, &{' '}
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-400 bg-clip-text text-transparent">
                Bebas Miskomunikasi.
              </span>
            </h1>

            {/* Persuasive Subheadline */}
            <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              Hentikan kekacauan tugas yang tercecer di chat WhatsApp dan spreadsheet manual. FlowTrack menggabungkan
              pelacakan tugas cerdas, inspeksi QA berlapis, dan persetujuan manajer dalam satu sistem yang elegan.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-primary-500 via-primary-600 to-emerald-600 hover:from-primary-600 hover:to-emerald-700 shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 transition-all group"
              >
                <span>Mulai Sekarang — 100% Gratis</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 shadow-sm transition-all"
              >
                <span>Lihat Simulasi Sistem</span>
                <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
              </a>
            </div>

            {/* Social Proof Mini Bar */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-neutral-500">
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-primary-500" />
                <span>Tanpa Kartu Kredit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-primary-500" />
                <span>Setup dalam 2 Menit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-primary-500" />
                <span>Workflow QA & Approval Terintegrasi</span>
              </div>
            </div>
          </div>

          {/* ===================== HERO APP PREVIEW MOCKUP ===================== */}
          <div id="demo" className="mt-14 lg:mt-16 relative max-w-5xl mx-auto">
            {/* Glow backdrop around preview */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary-500/30 via-pastel-blue-400/20 to-emerald-500/30 blur-2xl opacity-70 -z-10" />

            {/* Outer window mockup */}
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/80 overflow-hidden ring-1 ring-black/5">
              {/* Window Bar */}
              <div className="bg-neutral-50/90 border-b border-neutral-200/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                  <span className="ml-3 text-xs font-medium text-neutral-400 hidden sm:inline-block">
                    flowtrack.app/dashboard/projects/sprint-q4
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping" />
                    Live Workspace
                  </span>
                </div>
              </div>

              {/* Inside Mockup Body */}
              <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50/50">
                {/* Project Header Inside Mockup */}
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-lg bg-primary-50 text-primary-600">
                        <FolderIcon className="w-5 h-5" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-neutral-900">Revamp Portal E-Commerce & Payment API</h2>
                        <p className="text-xs text-neutral-500">Target Rilis: 30 November 2026 • 24 Tugas Aktif</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-neutral-500">Progres Sprint</div>
                      <div className="text-sm font-bold text-primary-600">82% Selesai</div>
                    </div>
                    <div className="w-24 bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-primary-500 to-emerald-400 h-2.5 rounded-full w-[82%]" />
                    </div>
                  </div>
                </div>

                {/* Simulated Kanban Columns / Task Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Column 1: Dalam Pengerjaan */}
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                          In Progress (3)
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/80 hover:border-primary-300 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          Backend
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" /> 2 hari lagi
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 mb-1">
                        Integrasi Webhook Payment Midtrans
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-1 mb-3">
                        Implementasi callback signature verification dan idempotent handler.
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                        <span className="text-[11px] font-medium text-neutral-600">PIC: Bagas (Dev)</span>
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                          BG
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          UI/UX
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" /> Besok
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 mb-1">Redesain Halaman Checkout Mobile</div>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                        <span className="text-[11px] font-medium text-neutral-600">PIC: Sarah (Designer)</span>
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center">
                          SR
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Verifikasi QA (Fitur Khas FlowTrack) */}
                  <div className="bg-primary-50/40 p-4 rounded-xl border-2 border-primary-200/80 shadow-sm flex flex-col gap-3 relative">
                    <div className="flex items-center justify-between border-b border-primary-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-primary-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-800">
                          QA Testing & Review (2)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-200 text-primary-800">
                        Kunci Kualitas
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white border border-primary-300 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          Testing Auth Flow
                        </span>
                        <span className="text-[11px] text-primary-600 font-medium flex items-center gap-1">
                          <CheckBadgeIcon className="w-3.5 h-3.5" /> Siap Review
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 mb-1">
                        Validasi Session Timeout & Multi-tab
                      </div>
                      <p className="text-xs text-neutral-500 mb-3">
                        Uji kelayakan security token saat user berganti tab atau idle selama 15 menit.
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                        <span className="text-[11px] text-primary-700 font-semibold">QA Lead: Dimas</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            9/10 Passed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white border border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          Load Testing
                        </span>
                        <span className="text-[11px] text-neutral-400">Sedang Uji</span>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 mb-1">Stress Test 5,000 Concurrent User</div>
                    </div>
                  </div>

                  {/* Column 3: Approved & Siap Deploy */}
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                          Approved & Done (8)
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3 text-emerald-600" /> Disetujui PM
                        </span>
                        <span className="text-[10px] font-medium text-emerald-700">Verified</span>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 mb-1 line-through text-neutral-500">
                        Modul Enkripsi Password & 2FA
                      </div>
                      <p className="text-xs text-neutral-400">Telah diapprove oleh Project Lead & QA lolos tanpa catatan.</p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3 text-emerald-600" /> Disetujui PM
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 line-through text-neutral-500">
                        Setup Database Migration & Indexes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Metric Badges for High Trust */}
            <div className="hidden lg:flex items-center gap-3 absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-neutral-200 animate-slide-up">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ArrowTrendingUpIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-neutral-500 font-medium">Efisiensi Eksekusi Tim</div>
                <div className="text-sm font-bold text-neutral-900">+48% Lebih Cepat Selesai</div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3 absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-neutral-200 animate-slide-up">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-neutral-500 font-medium">Akurasi & Kualitas Output</div>
                <div className="text-sm font-bold text-neutral-900">99.4% Zero Error Production</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== LOGO / TRUSTED BY BANNER ===================== */}
      <section className="py-12 border-y border-neutral-200/70 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-8">
            Dipercaya oleh tim pengembang, startup inovatif, dan agensi digital modern
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 items-center justify-center opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 font-bold text-neutral-700 text-lg">
              <CommandLineIcon className="w-6 h-6 text-primary-500" />
              <span>NEXUSTECH</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-neutral-700 text-lg">
              <SparklesIcon className="w-6 h-6 text-primary-500" />
              <span>CREATIVELABS</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-neutral-700 text-lg">
              <ChartBarIcon className="w-6 h-6 text-primary-500" />
              <span>DATAFLOW ID</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-neutral-700 text-lg">
              <ShieldCheckIcon className="w-6 h-6 text-primary-500" />
              <span>CYBERSCALE</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-neutral-700 text-lg col-span-2 sm:col-span-1">
              <UserGroupIcon className="w-6 h-6 text-primary-500" />
              <span>AGILECORP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== MASALAH VS SOLUSI (PERSUASIVE COMPARISON) ===================== */}
      <section id="solusi" className="py-20 lg:py-28 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Transformasi Manajemen Proyek
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-4 mb-4">
              Mengapa Metode Konvensional Selalu Berujung Kekacauan?
            </h2>
            <p className="text-base sm:text-lg text-neutral-600">
              Ketika tim Anda bertumbuh, mengandalkan pesan chat dan spreadsheet akan menciptakan lubang hitam:
              deadline terlewat, pekerjaan ganda, dan bug yang lolos ke klien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Tanpa FlowTrack (Red card) */}
            <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-2xl -z-10" />
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase mb-4">
                  <ExclamationTriangleIcon className="w-4 h-4" /> Cara Lama yang Menyiksa
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                  Spreadsheet & Obrolan Grup WhatsApp
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="p-1 rounded-full bg-red-100 text-red-600 mt-0.5">
                      <XMarkIcon className="w-4 h-4 stroke-[3]" />
                    </span>
                    <span className="text-sm text-neutral-600">
                      <strong>Tugas tercecer dan tertimbun:</strong> Tidak ada yang tahu pasti siapa yang sedang
                      mengerjakan apa saat ini.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="p-1 rounded-full bg-red-100 text-red-600 mt-0.5">
                      <XMarkIcon className="w-4 h-4 stroke-[3]" />
                    </span>
                    <span className="text-sm text-neutral-600">
                      <strong>Tidak ada verifikasi mutu:</strong> Developer mengklaim "sudah selesai", namun ternyata
                      banyak error ketika diuji di production.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="p-1 rounded-full bg-red-100 text-red-600 mt-0.5">
                      <XMarkIcon className="w-4 h-4 stroke-[3]" />
                    </span>
                    <span className="text-sm text-neutral-600">
                      <strong>Deadline terlewat tanpa alarm:</strong> Manajer baru menyadari keterlambatan saat klien
                      sudah mengajukan komplain.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="p-1 rounded-full bg-red-100 text-red-600 mt-0.5">
                      <XMarkIcon className="w-4 h-4 stroke-[3]" />
                    </span>
                    <span className="text-sm text-neutral-600">
                      <strong>Revisi tak berujung:</strong> Catatan revisi hilang di tumpukan chat panjang tanpa riwayat
                      perubahan.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-neutral-100 text-xs text-red-600 font-medium">
                Hasil: Pemborosan biaya 30% dan tim mengalami burnout konstan.
              </div>
            </div>

            {/* Dengan FlowTrack (Emerald card) */}
            <div className="bg-white rounded-2xl p-8 border-2 border-primary-500 shadow-xl relative overflow-hidden flex flex-col justify-between ring-4 ring-primary-500/10">
              <div className="absolute top-0 right-0 w-36 h-36 bg-primary-100 rounded-full blur-2xl -z-10" />
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase mb-4">
                  <CheckBadgeIcon className="w-4 h-4" /> Standar Modern Bersama FlowTrack
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                  Satu Ruang Kerja Terkendali & Terukur
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="p-1 rounded-full bg-primary-100 text-primary-600 mt-0.5">
                      <CheckCircleIcon className="w-4 h-4 stroke-[3]" />
                    </span>
                    <span className="text-sm text-neutral-700">
                      <strong>Transparansi status real-time:</strong> Mulai dari Pending, In Progress, hingga QA
                      Checked dan Approved terlihat seketika.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="p-1 rounded-full bg-primary-100 text-primary-600 mt-0.5">
                      <CheckCircleIcon className="w-4 h-4 stroke-[3]" />
                    </span>
                    <span className="text-sm text-neutral-700">
                      <strong>Gerbang QA & Approval Ketat:</strong> Setiap task wajib lolos verifikasi tim QA dan
                      persetujuan resmi PM sebelum tuntas.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="p-1 rounded-full bg-primary-100 text-primary-600 mt-0.5">
                      <CheckCircleIcon className="w-4 h-4 stroke-[3]" />
                    </span>
                    <span className="text-sm text-neutral-700">
                      <strong>Peringatan Otomatis Task Overdue:</strong> Sistem langsung menandai tugas yang mendekati
                      atau melewati batas waktu tenggat.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="p-1 rounded-full bg-primary-100 text-primary-600 mt-0.5">
                      <CheckCircleIcon className="w-4 h-4 stroke-[3]" />
                    </span>
                    <span className="text-sm text-neutral-700">
                      <strong>Alur Revisi Terarah:</strong> Beri catatan revisi dalam 1 klik; status kembali ke
                      pengembang dengan instruksi jelas.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-neutral-100 text-xs text-primary-700 font-bold flex items-center justify-between">
                <span>Hasil: Proyek selesai 2x lebih cepat dengan tingkat kepuasan 99%.</span>
                <span className="text-primary-600 underline">Lihat Cara Kerjanya →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FITUR UNGGULAN (CORE FEATURES) ===================== */}
      <section id="fitur" className="py-20 lg:py-28 bg-white border-t border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Fitur Lengkap Tanpa Kompromi
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-4 mb-4">
              Dirancang Khusus untuk Kebutuhan Tim Proyek Profesional
            </h2>
            <p className="text-base sm:text-lg text-neutral-600">
              Dari pemetaan ide pertama hingga pengiriman hasil akhir, setiap fitur di FlowTrack dibuat untuk
              meningkatkan kecepatan dan ketelitian tim Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:shadow-xl hover:border-primary-400 hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <FolderIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2.5">
                Struktur Proyek Multi-Level
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Kelompokkan pekerjaan berdasarkan proyek, deskripsi ruang lingkup, penanggung jawab, dan tanggal batas
                waktu. Pisahkan tiap proyek dengan data yang terisolasi dan rapi.
              </p>
            </div>

            {/* Feature 2: Dedicated QA */}
            <div className="p-8 rounded-2xl bg-white border-2 border-primary-500/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group relative">
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full border border-primary-200">
                Fitur Kunci
              </span>
              <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center mb-6 shadow-md shadow-primary-500/20">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2.5">
                Pipeline QA & Quality Gate
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Tidak ada task yang bisa 'selesai diam-diam'. Pengembang menuntaskan pekerjaan, QA menguji fungsionalitas,
                dan Project Manager memberikan persetujuan final.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:shadow-xl hover:border-primary-400 hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-pastel-blue-50 text-pastel-blue-600 flex items-center justify-center mb-6 group-hover:bg-pastel-blue-600 group-hover:text-white transition-all">
                <ClockIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2.5">
                Pelacak Deadline & Status Overdue
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Sistem menghitung sisa hari secara otomatis dan memberikan penanda warna merah mencolok ketika suatu
                tugas terlambat dari jadwal, meminimalkan keterlambatan proyek.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:shadow-xl hover:border-primary-400 hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-pastel-purple-50 text-pastel-purple-600 flex items-center justify-center mb-6 group-hover:bg-pastel-purple-600 group-hover:text-white transition-all">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2.5">
                Manajemen Peran & Akses (RBAC)
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Empat peran terstruktur: Admin, Project Manager, Member / Staff, dan QA Reviewer. Setiap anggota melihat
                dan mengelola hal yang memang menjadi wewenang tugasnya.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:shadow-xl hover:border-primary-400 hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-pastel-orange-50 text-pastel-orange-600 flex items-center justify-center mb-6 group-hover:bg-pastel-orange-600 group-hover:text-white transition-all">
                <ArrowPathIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2.5">
                Siklus Revisi & Catatan Instan
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Kapan pun hasil kerja belum sesuai kriteria, PM atau QA dapat mengubah status menjadi 'Revision' dengan
                penjelasan spesifik sehingga anggota dapat langsung memperbaikinya.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:shadow-xl hover:border-primary-400 hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2.5">
                Statistik & Metrik Real-Time
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Pantau total tugas, tugas dalam pengerjaan, status QA, jumlah revisi, dan rasio penyelesaian tepat waktu
                secara langsung di dasbor ringkasan interaktif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== INTERACTIVE WORKFLOW SHOWCASE TABS ===================== */}
      <section id="workflow" className="py-20 lg:py-28 bg-[#f8fafc] border-t border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Alur Kerja Teruji
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-4 mb-4">
              Jelajahi Bagaimana FlowTrack Menjamin Kesuksesan Proyek
            </h2>
            <p className="text-base sm:text-lg text-neutral-600">
              Pilih pilar alur kerja di bawah untuk melihat bagaimana tim berkolaborasi secara sinkron:
            </p>
          </div>

          {/* Interactive Navigation Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'tasks'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5" />
              <span>1. Manajemen Tugas Dinamis</span>
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'qa'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <ShieldCheckIcon className="w-5 h-5" />
              <span>2. Validasi & Pengujian QA</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>3. Dasbor Metrik & Analisis</span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'roles'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              <span>4. Hak Akses & Persetujuan PM</span>
            </button>
          </div>

          {/* Tab Content Cards */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/90 shadow-xl max-w-5xl mx-auto">
            {activeTab === 'tasks' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md mb-3">
                    Fase Pengerjaan
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    Tugaskan Pekerjaan dengan Detail & Tenggat Waktu Jelas
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                    Setiap tugas di FlowTrack dapat dipetakan dengan judul spesifik, deskripsi teknis, penanggung jawab
                    (assignee), tanggal batas akhir (due date), serta prioritas status. Anggota tim mengetahui persis apa
                    yang harus mereka kerjakan setiap hari.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Transisi status mudah dari Pending ke In Progress</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Peringatan visual saat mendekati deadline</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Filter cepat berdasarkan anggota dan status tugas</span>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                    Contoh Kartu Tugas Aktif
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        IN PROGRESS
                      </span>
                      <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-amber-500" /> Sisa 3 Hari
                      </span>
                    </div>
                    <div className="text-base font-bold text-neutral-900">
                      Optimasi Query Database Index & Caching
                    </div>
                    <p className="text-xs text-neutral-500">
                      Tambahkan composite index pada tabel orders dan terapkan Redis cache layer untuk query agregasi
                      bulanan.
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                          RH
                        </div>
                        <span className="text-xs font-medium text-neutral-700">Rian Hidayat</span>
                      </div>
                      <span className="text-xs text-primary-600 font-semibold">Proyek Backend API</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md mb-3">
                    Standar Kualitas
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    Verifikasi Berlapis Oleh Spesialis QA
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                    Begitu pelaksana menyelesaikan pekerjaan, status berubah menjadi 'Completed' yang langsung masuk ke
                    antrean verifikasi QA. Tim QA melakukan pengujian menyeluruh sebelum menandai status sebagai 'QA
                    Checked'.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Pemisahan tugas antara pelaksana dan penguji</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Kemudahan memberi feedback jika ditemukan bug</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Mencegah kode bermasalah dirilis ke konsumen</span>
                    </div>
                  </div>
                </div>
                <div className="bg-primary-50/50 rounded-2xl p-5 border border-primary-200">
                  <div className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-3">
                    Pipeline Pengujian Mutu
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-primary-300 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 flex items-center gap-1">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-primary-600" /> QA CHECKED
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">Semua Tes Lolos</span>
                    </div>
                    <div className="text-base font-bold text-neutral-900">Uji Ketahanan Sistem Autentikasi 2FA</div>
                    <div className="p-2.5 rounded bg-neutral-50 text-xs text-neutral-600 border border-neutral-150">
                      <strong>Catatan QA:</strong> Berhasil diuji pada 4 skenario login gagal berturut-turut, SMS OTP
                      terkirim dalam 1.2 detik, dan session invalidation bekerja sempurna.
                    </div>
                    <div className="text-right text-xs text-neutral-500">
                      Penguji: <strong>Faisal (Senior QA)</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md mb-3">
                    Visibilitas Operasional
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    Pengambilan Keputusan Berbasis Data Nyata
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                    Ketahui performa sprint Anda seketika tanpa perlu rapat berjam-jam untuk menanyakan status. Grafik
                    dan penghitung statistik menampilkan metrik kelancaran proyek secara real-time.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Rasio penyelesaian proyek dan waktu rata-rata eksekusi</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Deteksi dini hambatan (bottleneck) di tahap tertentu</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Laporan siap presentasi untuk pimpinan dan pemangku kepentingan</span>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                    Statistik Proyek Mingguan
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200">
                      <div className="text-xs text-neutral-500">Total Tugas</div>
                      <div className="text-2xl font-black text-neutral-900">42</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200">
                      <div className="text-xs text-neutral-500">Tugas Disetujui</div>
                      <div className="text-2xl font-black text-emerald-600">36</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200">
                      <div className="text-xs text-neutral-500">Sedang Uji QA</div>
                      <div className="text-2xl font-black text-primary-600">4</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200">
                      <div className="text-xs text-neutral-500">Overdue (Terlambat)</div>
                      <div className="text-2xl font-black text-red-500">0</div>
                    </div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold p-3 rounded-xl border border-emerald-200 text-center">
                    Tingkat On-Time Delivery: 100% pada sprint ini 🎉
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md mb-3">
                    Otoritas & Tata Kelola
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    Persetujuan Akhir di Tangan Project Manager
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                    Hanya Project Manager yang berwenang memberikan stempel 'Approved' setelah tugas lolos pengujian QA.
                    Bila masih ada yang belum sesuai, manajer dapat meminta 'Revision' cukup dengan satu klik tombol.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Sistem persetujuan berjenjang yang aman dan terdokumentasi</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Tombol Request Revision langsung mengembalikan status ke aktif</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                      <CheckCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>Kejelasan peran menjaga kepemimpinan tim tetap solid</span>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                    Aksi Persetujuan Project Manager
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-4">
                    <div>
                      <div className="text-xs text-neutral-400">Verifikasi QA Status</div>
                      <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                        <CheckBadgeIcon className="w-4 h-4" /> QA Verified by Dian (Pass)
                      </div>
                    </div>
                    <div className="text-sm font-medium text-neutral-800">
                      Tugas: Peluncuran Desain Sistem Brand Guidelines 2.0
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircleIcon className="w-4 h-4" /> Approve Task
                      </button>
                      <button
                        type="button"
                        className="py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <ArrowPathIcon className="w-3.5 h-3.5" /> Revisi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== STATS / IMPACT NUMBERS ===================== */}
      <section className="py-16 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.25),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-700/60">
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-primary-400 mb-2">99.4%</div>
              <div className="text-xs sm:text-sm text-neutral-400 font-medium">Tugas Selesai Tepat Waktu</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 mb-2">2.5x</div>
              <div className="text-xs sm:text-sm text-neutral-400 font-medium">Kecepatan Sprint Lebih Tinggi</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-pastel-blue-400 mb-2">0%</div>
              <div className="text-xs sm:text-sm text-neutral-400 font-medium">Miskomunikasi Status Tugas</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-amber-400 mb-2">4.9 / 5</div>
              <div className="text-xs sm:text-sm text-neutral-400 font-medium">Kepuasan Pengguna & Manajer</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS (SOCIAL PROOF) ===================== */}
      <section id="testimoni" className="py-20 lg:py-28 bg-white border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Kata Mereka yang Telah Membuktikan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-4 mb-4">
              Dipercaya oleh Para Pemimpin Tim & Pengembang
            </h2>
            <p className="text-base sm:text-lg text-neutral-600">
              Dengarkan langsung cerita bagaimana FlowTrack membawa ketenangan dan keteraturan dalam proyek skala
              besar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="p-8 rounded-2xl bg-[#fafbfc] border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarSolid key={i} className="w-5 h-5" />
                  ))}
                </div>
                <p className="text-neutral-700 text-sm leading-relaxed italic mb-6">
                  "Sebelum pakai FlowTrack, bug sering lolos ke production karena tim developer langsung menganggap tugas
                  selesai tanpa validasi. Sistem QA terpadu di FlowTrack memangkas angka keluhan klien hingga 90%!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-sm">
                  AP
                </div>
                <div>
                  <div className="font-bold text-neutral-900 text-sm">Aditya Pratama</div>
                  <div className="text-xs text-neutral-500">VP of Engineering, Lumina Digital</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-2xl bg-[#fafbfc] border-2 border-primary-300 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative">
              <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-700">
                Top Reviewer
              </span>
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarSolid key={i} className="w-5 h-5" />
                  ))}
                </div>
                <p className="text-neutral-700 text-sm leading-relaxed italic mb-6">
                  "Sebagai Project Manager yang menangani 6 proyek klien secara paralel, saya sangat terbantu dengan
                  peringatan Overdue otomatis dan tombol persetujuan approval. Tampilannya sangat bersih dan cepat."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  NW
                </div>
                <div>
                  <div className="font-bold text-neutral-900 text-sm">Nabila Wardhana</div>
                  <div className="text-xs text-neutral-500">Senior Project Lead, Inovasi Solusi</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-2xl bg-[#fafbfc] border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarSolid key={i} className="w-5 h-5" />
                  ))}
                </div>
                <p className="text-neutral-700 text-sm leading-relaxed italic mb-6">
                  "Onboarding tim baru cuma perlu 5 menit. Tidak ada menu berbelit-belit. Setiap anggota langsung paham
                  alur kerja mulai dari task ditugaskan, dikerjakan, dicek QA, sampai disetujui."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-pastel-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  RK
                </div>
                <div>
                  <div className="font-bold text-neutral-900 text-sm">Reza Kurniawan</div>
                  <div className="text-xs text-neutral-500">Co-Founder & CTO, NextGen Studio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HARGA / PRICING SECTION ===================== */}
      <section id="harga" className="py-20 lg:py-28 bg-[#f8fafc] border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Pilihan Paket Fleksibel
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-4 mb-4">
              Mulai Gratis Hari Ini, Tingkatkan Sesuai Kebutuhan
            </h2>
            <p className="text-base sm:text-lg text-neutral-600">
              Tidak ada biaya tersembunyi. Dapatkan semua fitur penting manajemen proyek dan QA secara gratis untuk tim
              kecil.
            </p>

            {/* Billing cycle switch */}
            <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-neutral-200/80 border border-neutral-300">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === 'monthly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>Tahunan</span>
                <span className="bg-primary-200 text-primary-800 text-[10px] px-1.5 py-0.2 rounded font-extrabold">
                  Hemat 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Plan 1: Free Starter */}
            <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Starter / Gratis
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">Tim Kecil & Mandiri</h3>
                <p className="text-xs text-neutral-500 mb-6">
                  Cocok untuk startup tahap awal, tim freelance, dan proyek internal.
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-neutral-900">Rp 0</span>
                  <span className="text-neutral-500 text-xs">/ selamanya</span>
                </div>
                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Hingga 5 Anggota Tim</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Proyek Tak Terbatas</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Manajemen Tugas & Status Lengkap</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Alur Kerja QA & Approval Dasar</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full text-center py-3 px-4 rounded-xl border border-neutral-200 hover:border-neutral-300 font-bold text-neutral-800 text-sm hover:bg-neutral-50 transition-all"
              >
                Daftar Gratis Sekarang
              </Link>
            </div>

            {/* Plan 2: Pro (Featured) */}
            <div className="bg-white rounded-3xl p-8 border-2 border-primary-500 shadow-2xl flex flex-col justify-between relative ring-4 ring-primary-500/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-emerald-600 text-white text-[11px] font-extrabold tracking-wider uppercase px-3 py-0.5 rounded-full shadow-md">
                Paling Diminati Tim
              </span>
              <div>
                <div className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">
                  Professional Team
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">Pertumbuhan & Agensi</h3>
                <p className="text-xs text-neutral-500 mb-6">
                  Solusi ideal untuk tim pengembang yang menginginkan kontrol QA dan metrik menyeluruh.
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-neutral-900">
                    {billingCycle === 'yearly' ? 'Rp 79.000' : 'Rp 99.000'}
                  </span>
                  <span className="text-neutral-500 text-xs">/ pengguna / bln</span>
                </div>
                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-neutral-900">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Semua fitur di Starter</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Anggota Tim Tak Terbatas</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Full QA & Approval Pipeline Gate</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Deteksi Overdue & Auto Alert</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Dasbor Analitik & Laporan Produktivitas</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full text-center py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 transition-all"
              >
                Coba Gratis 14 Hari
              </Link>
            </div>

            {/* Plan 3: Enterprise */}
            <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Enterprise
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">Perusahaan Besar</h3>
                <p className="text-xs text-neutral-500 mb-6">
                  Tata kelola lanjutan, keamanan tingkat perbankan, dan bantuan prioritas 24/7.
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-neutral-900">Kustom</span>
                  <span className="text-neutral-500 text-xs">/ sesuai skala</span>
                </div>
                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-neutral-900">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Semua fitur Professional</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Dedicated Account Manager & SLA</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Integrasi Single Sign-On (SSO / SAML)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-neutral-700">
                    <CheckCircleIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>Audit Trail Log & Kepatuhan Keamanan</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full text-center py-3 px-4 rounded-xl border border-neutral-200 hover:border-neutral-300 font-bold text-neutral-800 text-sm hover:bg-neutral-50 transition-all"
              >
                Hubungi Tim Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FAQ ACCORDION ===================== */}
      <section id="faq" className="py-20 lg:py-28 bg-white border-t border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-4 mb-4">
              Masih Ada Keraguan? Temukan Jawabannya di Sini
            </h2>
            <p className="text-base sm:text-lg text-neutral-600">
              Berikut poin-poin penjelasan mengenai kemudahan dan keandalan FlowTrack.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={index}
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    isOpen ? 'border-primary-300 bg-primary-50/20 shadow-sm' : 'border-neutral-200 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 font-bold text-neutral-900 focus:outline-none"
                  >
                    <span className="text-base">{faq.q}</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-primary-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FINAL HIGH-CONVERSION CTA BANNER ===================== */}
      <section className="py-20 lg:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-emerald-800 text-white relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider mb-6">
            <SparklesIcon className="w-4 h-4 text-emerald-200" />
            <span>Gabung Hari Ini Tanpa Resiko</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-6 leading-tight">
            Siap Mengakhiri Kekacauan Proyek & Mempercepat Eksekusi Tim Anda?
          </h2>

          <p className="text-base sm:text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Daftar sekarang dan nikmati kemudahan mengontrol tugas, inspeksi QA, dan deadline dalam satu aplikasi modern.
            Setup instan, gratis selamanya untuk tim kecil.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 rounded-xl text-base font-bold text-neutral-900 bg-white hover:bg-neutral-100 shadow-2xl hover:scale-105 transition-all group"
            >
              <span>Buat Akun Gratis Sekarang</span>
              <ArrowRightIcon className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all"
            >
              Sudah Punya Akun? Masuk
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-primary-100/90 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckBadgeIcon className="w-4 h-4 text-emerald-300" />
              <span>Akses Instan 60 Detik</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-300" />
              <span>Enkripsi Data Standar Industri</span>
            </div>
            <div className="flex items-center gap-1.5">
              <StarIcon className="w-4 h-4 text-emerald-300" />
              <span>Bisa Dibatalkan Kapan Saja</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-neutral-900 text-neutral-400 py-16 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <LogoMark className="h-9 w-9 rounded-xl" />
                <span className="text-xl font-bold tracking-tight text-white">FlowTrack</span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-sm mb-6">
                Platform manajemen proyek dan validasi QA modern yang dirancang untuk membantu tim teknologi dan agensi
                mencapai hasil terbaik dengan akurasi tinggi dan minim miskomunikasi.
              </p>
              <div className="text-xs text-neutral-500">
                © {new Date().getFullYear()} FlowTrack Technologies Inc. Seluruh hak cipta dilindungi.
              </div>
            </div>

            {/* Col 2: Produk */}
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider mb-4">Fitur Produk</div>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#fitur" className="hover:text-white transition-colors">
                    Manajemen Tugas
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    Pipeline QA Testing
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    Persetujuan & Revisi
                  </a>
                </li>
                <li>
                  <a href="#fitur" className="hover:text-white transition-colors">
                    Analitik & Overdue
                  </a>
                </li>
                <li>
                  <a href="#harga" className="hover:text-white transition-colors">
                    Harga Paket
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Solusi */}
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider mb-4">Solusi Tim</div>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <span className="text-neutral-400">Software Development</span>
                </li>
                <li>
                  <span className="text-neutral-400">Digital Agency</span>
                </li>
                <li>
                  <span className="text-neutral-400">Product Management</span>
                </li>
                <li>
                  <span className="text-neutral-400">Quality Assurance</span>
                </li>
                <li>
                  <span className="text-neutral-400">Startup & Enterprise</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Keamanan & Akun */}
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider mb-4">Akses Cepat</div>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/register" className="hover:text-white text-primary-400 font-semibold transition-colors">
                    Daftar Akun Baru
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Masuk ke Sistem
                  </Link>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Pusat Bantuan & FAQ
                  </a>
                </li>
                <li>
                  <span className="text-neutral-500">Kebijakan Privasi</span>
                </li>
                <li>
                  <span className="text-neutral-500">Syarat & Ketentuan</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>Dibangun dengan standar performa dan keamanan tinggi menggunakan Laravel & React.</p>
            <div className="flex items-center gap-6">
              <span>Status Sistem: 99.98% Uptime</span>
              <span>Bahasa: Indonesia (ID)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
