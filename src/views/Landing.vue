<template>
  <div class="min-h-screen relative bg-slate-50 flex flex-col">
    <!-- Decorative Background Blobs (isolated overflow) -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div aria-hidden="true" class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-300 opacity-20 blur-3xl"></div>
      <div aria-hidden="true" class="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-300 opacity-20 blur-3xl"></div>
    </div>

    <!-- Header -->
    <header
      ref="headerRef"
      class="sticky top-0 z-50 w-full border-b transition-colors duration-300"
      :class="isCondensed ? 'bg-blue-900 border-blue-800 shadow-sm' : 'bg-white/80 border-slate-200 backdrop-blur supports-[backdrop-filter]:bg-white/60'"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          class="flex items-center justify-between transition-all duration-300"
          :class="isCondensed ? 'py-2' : 'py-3'"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="logoSrc"
              :src="logoSrc"
              alt="Logo"
              class="object-contain transition-all duration-300"
              :class="isCondensed ? 'h-8 w-8' : 'h-10 w-10'"
            />
            <div>
              <p class="text-sm font-semibold leading-tight" :class="isCondensed ? 'text-white' : 'text-blue-900'">National College of</p>
              <p class="-mt-0.5 text-lg font-extrabold tracking-tight" :class="isCondensed ? 'text-white' : 'text-blue-900'">Science and Technology</p>
            </div>
          </div>
          <nav
            class="hidden md:flex items-center text-[15px] font-semibold transition-all duration-300"
            :class="[isCondensed ? 'gap-4 text-white' : 'gap-6 text-slate-700']"
          >
            <RouterLink to="/" :class="isCondensed ? 'hover:text-emerald-200' : 'hover:text-blue-900'">Home</RouterLink>
            <a href="#programs" @click.prevent="scrollTo('#programs')" :class="isCondensed ? 'hover:text-emerald-200' : 'hover:text-blue-900'">Programs</a>
            <a href="#why" @click.prevent="scrollTo('#why')" :class="isCondensed ? 'hover:text-emerald-200' : 'hover:text-blue-900'">Why NCST</a>
            <RouterLink
              to="/freshman-enrollment"
              :class="isCondensed
                ? 'px-3 py-1.5 rounded-md bg-white text-blue-900 hover:bg-blue-50 transition'
                : 'px-3 py-1.5 rounded-md bg-blue-900 text-white hover:bg-blue-800 transition'"
            >Apply</RouterLink>
            <RouterLink
              to="/login"
              :class="isCondensed
                ? 'px-3 py-1.5 rounded-md border border-white text-white hover:bg-white/10 transition'
                : 'px-3 py-1.5 rounded-md border border-blue-900 text-blue-900 hover:bg-blue-50 transition'"
            >Student Login</RouterLink>
          </nav>
          <button @click="mobileOpen = !mobileOpen" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border transition-colors" :class="isCondensed ? 'text-white border-white/40 hover:bg-white/10' : 'text-blue-900 border-blue-200 hover:bg-blue-50'" aria-label="Toggle navigation">
            <span class="i-lucide-menu"></span>
            <span class="sr-only">Open menu</span>
            <svg v-if="!mobileOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div v-if="mobileOpen" class="md:hidden pb-3">
          <div class="grid gap-1 font-medium" :class="isCondensed ? 'text-white' : 'text-slate-700'">
            <RouterLink @click="mobileOpen=false" to="/" class="px-2 py-2 rounded hover:bg-blue-50">Home</RouterLink>
            <a @click.prevent="scrollTo('#programs'); mobileOpen=false" href="#programs" :class="['px-2 py-2 rounded', isCondensed ? 'hover:bg-white/10' : 'hover:bg-blue-50']">Programs</a>
            <a @click.prevent="scrollTo('#why'); mobileOpen=false" href="#why" :class="['px-2 py-2 rounded', isCondensed ? 'hover:bg-white/10' : 'hover:bg-blue-50']">Why NCST</a>
            <RouterLink @click="mobileOpen=false" to="/freshman-enrollment" :class="isCondensed ? 'px-2 py-2 rounded bg-white text-blue-900' : 'px-2 py-2 rounded bg-blue-900 text-white'">Apply</RouterLink>
            <RouterLink @click="mobileOpen=false" to="/login" :class="isCondensed ? 'px-2 py-2 rounded border border-white text-white' : 'px-2 py-2 rounded border border-blue-900 text-blue-900'">Student Login</RouterLink>
          </div>
        </div>
      </div>
    </header>
    <!-- Hero -->
    <main class="pt-0 flex-1 flex flex-col items-stretch">
      <!-- Hero with background image and overlay -->
      <div class="w-full max-w-7xl mx-auto relative px-4 sm:px-6 py-6 sm:py-10">
        <section
          class="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden relative z-10 shadow-2xl ring-1 ring-white/30"
          :style="{ minHeight: 'calc(100vh - var(--header-offset, 68px) - 100px)' }"
        >
          <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${bgUrl})` }"></div>
          <div class="relative p-6 sm:p-10">
            <div class="max-w-2xl">
            <div class="text-left text-white">
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

                            <!-- Highlights -->
                            <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-start gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
                  <span class="text-emerald-400 text-xl">✓</span>
                  <div>
                    <h4 class="font-bold text-white">CHED-Recognized Programs</h4>
                    <p class="text-white/80 text-sm">Industry-aligned curricula and labs</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
                  <span class="text-emerald-400 text-xl">✓</span>
                  <div>
                    <h4 class="font-bold text-white">Scholarships & Aid</h4>
                    <p class="text-white/80 text-sm">Opportunities for qualified students</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
                  <span class="text-emerald-400 text-xl">✓</span>
                  <div>
                    <h4 class="font-bold text-white">Modern Learning</h4>
                    <p class="text-white/80 text-sm">Flexible, mobile-first experience</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
                  <span class="text-emerald-400 text-xl">✓</span>
                  <div>
                    <h4 class="font-bold text-white">Strong Industry Links</h4>
                    <p class="text-white/80 text-sm">Internships and career pathways</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Why NCST Section -->
      <section id="why" class="py-12 sm:py-16 bg-white scroll-mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-blue-900 text-center">Why Choose NCST</h2>
          <p class="mt-2 text-center text-slate-600">Industry-aligned programs, modern facilities, and a student-first experience.</p>
          <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="p-6 rounded-2xl border bg-white shadow-sm hover:shadow transition">
              <div class="text-3xl">🏫</div>
              <h3 class="mt-3 font-bold text-blue-900">Modern Campus</h3>
              <p class="mt-1 text-sm text-slate-600">State-of-the-art labs and collaborative spaces.</p>
            </div>
            <div class="p-6 rounded-2xl border bg-white shadow-sm hover:shadow transition">
              <div class="text-3xl">🤝</div>
              <h3 class="mt-3 font-bold text-blue-900">Industry Partners</h3>
              <p class="mt-1 text-sm text-slate-600">Strong ties with top employers.</p>
            </div>
            <div class="p-6 rounded-2xl border bg-white shadow-sm hover:shadow transition">
              <div class="text-3xl">📚</div>
              <h3 class="mt-3 font-bold text-blue-900">Quality Programs</h3>
              <p class="mt-1 text-sm text-slate-600">Relevant, practical, and future-ready curricula.</p>
            </div>
            <div class="p-6 rounded-2xl border bg-white shadow-sm hover:shadow transition">
              <div class="text-3xl">🧭</div>
              <h3 class="mt-3 font-bold text-blue-900">Student Support</h3>
              <p class="mt-1 text-sm text-slate-600">Guidance, scholarships, and career services.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Programs Section -->
      <section id="programs" class="py-12 sm:py-16 bg-slate-50 scroll-mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-blue-900">Academic Programs</h2>
              <p class="mt-1 text-slate-600">Explore our offerings across disciplines.</p>
            </div>
            <RouterLink to="/freshman-enrollment" class="hidden sm:inline-flex px-4 py-2 rounded-md bg-blue-900 text-white font-semibold hover:bg-blue-800">Apply Now</RouterLink>
          </div>
          <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow transition">
              <div class="h-32 bg-gradient-to-r from-blue-200 to-blue-100"></div>
              <div class="p-5">
                <h3 class="font-bold text-blue-900">Engineering & Technology</h3>
                <p class="mt-1 text-sm text-slate-600">Hands-on programs for innovators and builders.</p>
              </div>
            </div>
            <div class="rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow transition">
              <div class="h-32 bg-gradient-to-r from-emerald-200 to-emerald-100"></div>
              <div class="p-5">
                <h3 class="font-bold text-blue-900">Information Technology</h3>
                <p class="mt-1 text-sm text-slate-600">Software, data, and systems for the digital age.</p>
              </div>
            </div>
            <div class="rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow transition">
              <div class="h-32 bg-gradient-to-r from-amber-200 to-amber-100"></div>
              <div class="p-5">
                <h3 class="font-bold text-blue-900">Business & Management</h3>
                <p class="mt-1 text-sm text-slate-600">Leadership, finance, and entrepreneurship.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="py-12 sm:py-16 bg-gradient-to-r from-blue-900 to-blue-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-8 text-center">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Ready to take the next step?</h2>
            <p class="mt-2 text-blue-100">Join a community that builds your future.</p>
            <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <RouterLink to="/freshman-enrollment" class="px-6 py-3 rounded-lg bg-white text-blue-900 font-semibold hover:bg-blue-50">Start Application</RouterLink>
              <RouterLink to="/login" class="px-6 py-3 rounded-lg border border-white text-white font-semibold hover:bg-white/10">Student Login</RouterLink>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div class="flex items-center gap-2">
            <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="h-8 w-8" />
            <span class="font-extrabold text-blue-900">NCST</span>
          </div>
          <p class="mt-3 text-slate-600">National College of Science and Technology</p>
          <p class="mt-1 text-slate-500">Empowering learners for the future.</p>
        </div>
        <div>
          <h3 class="font-bold text-blue-900">Explore</h3>
          <ul class="mt-3 space-y-2 text-slate-600">
            <li><a href="#programs" class="hover:text-blue-900">Programs</a></li>
            <li><a href="#why" class="hover:text-blue-900">Why NCST</a></li>
            <li><a href="#news" class="hover:text-blue-900">News & Events</a></li>
          </ul>
        </div>
        <div>
          <h3 class="font-bold text-blue-900">Admissions</h3>
          <ul class="mt-3 space-y-2 text-slate-600">
            <li><RouterLink to="/freshman-enrollment" class="hover:text-blue-900">Freshman</RouterLink></li>
            <li><RouterLink to="/login" class="hover:text-blue-900">Student Portal</RouterLink></li>
          </ul>
        </div>
        <div>
          <h3 class="font-bold text-blue-900">Connect</h3>
          <ul class="mt-3 space-y-2 text-slate-600">
            <li>Email: info@ncst.edu.ph</li>
            <li>Phone: (000) 123 4567</li>
            <li>Address: Dasmariñas, Cavite</li>
          </ul>
        </div>
      </div>
      <div class="py-4 text-center text-xs text-gray-600 bg-white/40">
        {{ new Date().getFullYear() }} National College of Science and Technology. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import logoUrl from '@/img/logo.png'
import bg from '@/img/background.jpg'

const logoSrc = logoUrl
const bgUrl = bg
const mobileOpen = ref(false)
const isCondensed = ref(false)
const headerRef = ref(null)
const headerHeight = ref('68px')

let lastScrollY = 0
let ticking = false
// Hysteresis thresholds to avoid flicker and only expand near the very top
const EXPAND_AT_Y = 20   // expand header when within 20px of top
const CONDENSE_AT_Y = 80 // condense header when beyond 80px from top

const onScroll = () => {
  const currentY = window.scrollY || 0
  // Use position-based hysteresis: stay condensed unless near the very top
  if (isCondensed.value) {
    // Currently condensed; only expand when very close to the top
    if (currentY <= EXPAND_AT_Y) {
      isCondensed.value = false
    }
  } else {
    // Currently expanded; condense after scrolling past threshold
    if (currentY >= CONDENSE_AT_Y) {
      isCondensed.value = true
    }
  }

  // After state changes, update measured height on next frame
  nextTick(() => {
    if (headerRef.value) {
      headerHeight.value = `${headerRef.value.offsetHeight}px`
      document.documentElement.style.setProperty('--header-offset', headerHeight.value)
    }
  })

  lastScrollY = currentY
  ticking = false
}

const handleScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(onScroll)
    ticking = true
  }
}

onMounted(() => {
  lastScrollY = window.scrollY || 0
  window.addEventListener('scroll', handleScroll, { passive: true })
  const updateSize = () => {
    if (headerRef.value) {
      headerHeight.value = `${headerRef.value.offsetHeight}px`
      document.documentElement.style.setProperty('--header-offset', headerHeight.value)
    }
  }
  window.addEventListener('resize', updateSize, { passive: true })
  // Initial measure after render
  nextTick(updateSize)
  // store remover on instance
  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateSize)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Programmatic anchor scroll with dynamic header offset
const scrollTo = (selector) => {
  const el = document.querySelector(selector)
  if (!el) return
  const headerH = headerRef.value ? headerRef.value.offsetHeight : 0
  const y = el.getBoundingClientRect().top + window.pageYOffset - headerH
  window.scrollTo({ top: y, behavior: 'smooth' })
}
</script>

<style scoped>
.gradient-overlay {
  background: linear-gradient(90deg, rgba(2,0,36,0.8) 0%, rgba(0,0,0,0.3) 100%);
}
</style>

<!-- Global styles for anchor offset -->
<style>
html {
  scroll-padding-top: var(--header-offset, 68px);
  scroll-behavior: smooth;
}
</style>
