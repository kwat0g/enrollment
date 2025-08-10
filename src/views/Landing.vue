<template>
  <div class="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col">
    <!-- Decorative Background Blobs -->
    <div aria-hidden="true" class="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-300 opacity-20 blur-3xl"></div>
    <div aria-hidden="true" class="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-300 opacity-20 blur-3xl"></div>

    <!-- Header -->
    <header class="w-full py-4 px-4 sm:px-8 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="h-10 w-10 object-contain" />
        <h1 class="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-tight">National College of Science and Technology</h1>
      </div>
      <nav class="hidden sm:flex items-center gap-3">
        <RouterLink to="/freshman-enrollment" class="px-3 py-1.5 text-blue-900 font-semibold hover:underline">Apply</RouterLink>
        <RouterLink to="/login" class="px-3 py-1.5 text-blue-900 font-semibold hover:underline">Student Login</RouterLink>
      </nav>
    </header>

    <!-- Hero -->
    <main class="flex-1 flex items-center justify-center px-4">
      <!-- Hero with background image and overlay -->
      <div class="w-full max-w-7xl mx-auto relative py-6 sm:py-10">
        <section class="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden relative z-10 shadow-2xl ring-1 ring-white/30">
          <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${bgUrl})` }"></div>
          <div class="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 sm:p-10">
            <div class="order-2 md:order-1 text-center md:text-left text-white">
              <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
                Welcome to your next chapter
              </h2>
              <p class="mt-3 text-white text-sm sm:text-base">
                Apply online, manage your student profile, and track your enrollment—all in one place.
              </p>
              <div class="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                <RouterLink to="/freshman-enrollment" class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow hover:bg-emerald-400 transition">
                  Start Freshman Application
                </RouterLink>
                <RouterLink to="/login" class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/90 text-blue-900 font-semibold border border-white/60 shadow hover:bg-white transition">
                  Student Login
                </RouterLink>
              </div>

            <!-- Stats badges -->
            <div class="mt-6 grid grid-cols-3 gap-3 text-center">
              <div class="rounded-lg bg-white/10 backdrop-blur p-3">
                <div class="text-2xl font-extrabold text-white">10k+</div>
                <div class="text-[11px] uppercase tracking-wide text-blue-100">Applicants</div>
              </div>
              <div class="rounded-lg bg-white/10 backdrop-blur p-3">
                <div class="text-2xl font-extrabold text-white">100%</div>
                <div class="text-[11px] uppercase tracking-wide text-blue-100">Online</div>
              </div>
              <div class="rounded-lg bg-white/10 backdrop-blur p-3">
                <div class="text-2xl font-extrabold text-white">24/7</div>
                <div class="text-[11px] uppercase tracking-wide text-blue-100">Access</div>
              </div>
            </div>
          </div>
          <div class="order-1 md:order-2">
            <div class="relative mx-auto max-w-sm">
              <div class="absolute -inset-4 bg-emerald-300 rounded-3xl blur-2xl opacity-30"></div>
              <div class="relative bg-white/95 rounded-3xl shadow-2xl border border-white/40 p-6">
                <div class="text-center">
                  <div class="text-6xl">🎓</div>
                  <h3 class="mt-3 text-lg font-bold text-blue-900">Seamless Enrollment</h3>
                  <p class="mt-1 text-gray-600 text-sm">Fast. Secure. Mobile-friendly.</p>
                </div>
                <ul class="mt-5 space-y-2 text-sm text-gray-700">
                  <li class="flex items-start gap-2"><span class="text-emerald-600">•</span> Online freshman applications</li>
                  <li class="flex items-start gap-2"><span class="text-emerald-600">•</span> Real-time status tracking</li>
                  <li class="flex items-start gap-2"><span class="text-emerald-600">•</span> Course offerings and schedules</li>
                  <li class="flex items-start gap-2"><span class="text-emerald-600">•</span> Secure student and admin portals</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-6 text-center text-xs text-gray-600 bg-white/40">
      {{ new Date().getFullYear() }} National College of Science and Technology. All rights reserved.
    </footer>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import logoUrl from '@/img/logo.png'
import bg from '@/img/background.jpg'

const logoSrc = logoUrl
const bgUrl = bg
</script>

<style scoped>
/* Optional custom styles */
</style>
