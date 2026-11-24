/*
Copyright (C) 2026 MozzaBot This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const APP_CONFIG = window.APP_CONFIG || {};
const DISPLAY_NAME = String(APP_CONFIG.collegeName || 'Your College');
const DISPLAY_TIME_ZONE = String(APP_CONFIG.timeZone || 'UTC');
const DISPLAY_LOCALE = String(APP_CONFIG.locale || 'en');
const PRAYER_TIMES_ENDPOINT = String(APP_CONFIG.prayerTimesEndpoint || '').trim();

function renderTickerAnnouncements(container, text) {
  const announcements = String(text || '').split('|').map((item) => item.trim()).filter(Boolean);
  const tickerNodes = [];
  const track = document.createElement('div');
  track.className = 'ticker-track';

  for (let copy = 0; copy < 2; copy += 1) {
    announcements.forEach((announcement, index) => {
      const item = document.createElement('span');
      item.className = 'ticker-announcement';
      item.textContent = announcement;
      tickerNodes.push(item);

      if (index < announcements.length - 1 || copy === 0) {
        const pause = document.createElement('span');
        pause.className = 'ticker-pause';
        pause.textContent = '|';
        tickerNodes.push(pause);
      }
    });
  }

  track.replaceChildren(...tickerNodes);
  container.replaceChildren(track);
}

function youtubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = parsedUrl.pathname.slice(1);
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      videoId = parsedUrl.searchParams.get('v') || parsedUrl.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || '';
    }

    return /^[\w-]{11}$/.test(videoId) ? videoId : '';
  } catch {
    return '';
  }
}

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (window.youtubeApiPromise) {
    return window.youtubeApiPromise;
  }

  window.youtubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    const apiScript = document.createElement('script');
    apiScript.src = 'https://www.youtube.com/iframe_api';
    apiScript.onerror = reject;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') {
        previousCallback();
      }
      resolve(window.YT);
    };
    document.head.appendChild(apiScript);
  });

  return window.youtubeApiPromise;
}

function renderDashboardAnnouncements(slides) {
  for (const section of ['primary', 'secondary']) {
    const card = document.querySelector(`.dashboard-announcement[data-section="${section}"]`);
    const slide = [...slides].reverse().find((item) => (
      String(item.caption || '').trim().toLowerCase() === section
    ));
    const image = card.querySelector('img');
    const title = card.querySelector('h3');
    const message = card.querySelector('.announcement-message');
    const imageUrl = safeHttpsUrl(slide?.imageUrl);

    card.classList.toggle('has-image', Boolean(imageUrl));
    image.hidden = !imageUrl;
    if (imageUrl) {
      image.src = imageUrl;
      image.alt = slide?.title || `${section.toUpperCase()} announcement`;
    } else {
      image.removeAttribute('src');
      image.alt = '';
    }

    title.textContent = slide?.title || 'No announcement';
    message.textContent = slide?.message || (slide ? '' : 'Updates will appear here.');
  }
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function renderTimetable(urlValue) {
  const frame = document.getElementById('timetable-frame');
  const placeholder = document.getElementById('timetable-placeholder');
  const url = safeHttpsUrl(urlValue);
  frame.hidden = !url;
  placeholder.hidden = Boolean(url);
  if (url && frame.src !== url) {
    frame.src = url;
  } else if (!url) {
    frame.removeAttribute('src');
  }
}

const HIJRI_MONTHS_MS = [
  'Muharam', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jamadilawal', 'Jamadilakhir',
  'Rejab', 'Syaaban', 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'
];
let cachedPrayerSchedule = null;
let cachedPrayerScheduleAt = 0;
let cachedPrayerScheduleYearMonth = '';
let currentPrayerSchedule = null;

function configuredDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function configuredDateKey(date = new Date()) {
  const { year, month, day } = configuredDateParts(date);
  return `${year}-${month}-${day}`;
}

function dateTimeInputToIso(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/);
  if (!match) {
    throw new Error('Enter a valid event date and time.');
  }
  const [year, month, day] = match[1].split('-').map(Number);
  const [hour, minute] = match[2].split(':').map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = targetUtc;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: DISPLAY_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date(timestamp)).map(({ type, value }) => [type, Number(value)]));
    const representedUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    timestamp = targetUtc - (representedUtc - Math.floor(timestamp / 1000) * 1000);
  }

  return new Date(timestamp).toISOString();
}

function configuredDateTimeInputValue(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '';
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function prayerDateKey(dateText) {
  const isoDate = String(dateText || '').match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoDate) {
    return isoDate[0];
  }
  const match = String(dateText || '').match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) {
    return '';
  }
  const monthNumber = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  }[match[2].toLowerCase()];
  return monthNumber ? `${match[3]}-${monthNumber}-${match[1].padStart(2, '0')}` : '';
}

async function fetchPrayerSchedule() {
  if (!PRAYER_TIMES_ENDPOINT) {
    throw new Error('Set prayerTimesEndpoint in config.js to enable prayer times.');
  }
  const { year, month } = configuredDateParts();
  const currentYearMonth = `${year}-${month}`;
  if (
    cachedPrayerSchedule
    && cachedPrayerScheduleYearMonth === currentYearMonth
    && Date.now() - cachedPrayerScheduleAt < 6 * 60 * 60 * 1000
  ) {
    return cachedPrayerSchedule;
  }

  const endpoint = new URL(PRAYER_TIMES_ENDPOINT);
  endpoint.searchParams.set('month', String(Number(month)));
  endpoint.searchParams.set('year', year);
  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Prayer schedule returned HTTP ${response.status}`);
  }
  const result = await response.json();
  if (!Array.isArray(result.prayerTime) || result.prayerTime.length === 0) {
    throw new Error('Prayer schedule has no daily entries');
  }

  cachedPrayerSchedule = result.prayerTime;
  cachedPrayerScheduleAt = Date.now();
  cachedPrayerScheduleYearMonth = currentYearMonth;
  return cachedPrayerSchedule;
}

async function prayerScheduleForToday() {
  const schedule = await fetchPrayerSchedule();
  const dateKey = configuredDateKey();
  const today = schedule.find((day) => prayerDateKey(day.date) === dateKey);
  if (!today) {
    throw new Error(`Prayer schedule has no entry for ${dateKey}`);
  }
  return today;
}

function formatHijriDate(hijriDate) {
  const match = String(hijriDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return hijriDate || 'Hijri date unavailable';
  }
  const month = HIJRI_MONTHS_MS[Number(match[2]) - 1];
  return month
    ? `${Number(match[3])} ${month} ${match[1]}H`
    : hijriDate;
}

function prayerTimeMinutes(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function configuredClockParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
}

function nextPrayerInfo(schedule, now = new Date()) {
  const nowParts = configuredClockParts(now);
  const currentSeconds = nowParts.hour * 3600 + nowParts.minute * 60 + nowParts.second;
  const prayers = [
    ['Fajr', schedule.fajr],
    ['Dhuhr', schedule.dhuhr],
    ['Asar', schedule.asr],
    ['Maghrib', schedule.maghrib],
    ['Isha', schedule.isha]
  ];

  for (const [name, value] of prayers) {
    const minutes = prayerTimeMinutes(value);
    if (minutes !== null && minutes * 60 > currentSeconds) {
      return { name, secondsUntil: minutes * 60 - currentSeconds };
    }
  }

  const fajr = prayerTimeMinutes(schedule.fajr);
  return {
    name: 'Fajr',
    secondsUntil: fajr === null ? 0 : 24 * 60 * 60 - currentSeconds + fajr * 60
  };
}

function updatePrayerCountdown(schedule) {
  const name = document.getElementById('next-prayer-name');
  const countdown = document.getElementById('next-prayer-countdown');
  if (!name || !countdown) {
    return;
  }
  const next = nextPrayerInfo(schedule);
  const hours = Math.floor(next.secondsUntil / 3600);
  const minutes = Math.floor((next.secondsUntil % 3600) / 60);
  const seconds = next.secondsUntil % 60;
  name.textContent = next.name;
  countdown.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function updatePrayerTimes() {
  const status = document.getElementById('prayer-status');
  if (!status) {
    return;
  }
  if (!PRAYER_TIMES_ENDPOINT) {
    status.textContent = 'Configure the prayer feed in config.js';
    return;
  }
  try {
    const today = await prayerScheduleForToday();
    currentPrayerSchedule = today;
    const prayerEntries = [
      ['fajr', 'Fajr'],
      ['syuruk', 'Sunrise'],
      ['dhuhr', 'Dhuhr'],
      ['asr', 'Asr'],
      ['maghrib', 'Maghrib'],
      ['isha', 'Isha']
    ];
    const prayerItems = [...document.querySelectorAll('.prayer-time')];
    prayerEntries.forEach(([key], index) => {
      if (prayerItems[index]) {
        prayerItems[index].querySelector('time').textContent = String(today[key] || '--:--').slice(0, 5);
      }
    });

    const hijriDate = document.getElementById('hijri-date');
    if (hijriDate) {
      hijriDate.textContent = formatHijriDate(today.hijri);
    }
    status.textContent = APP_CONFIG.prayerTimesLabel || 'Configured location';
    updatePrayerCountdown(today);
  } catch (error) {
    status.textContent = 'Prayer times unavailable';
    console.warn('Unable to load the configured prayer schedule.', error);
  }
}

async function initFeedDisplayPage() {
  const stage = document.getElementById('media-stage');
  const emptyState = document.getElementById('empty-state');
  const videoAudioToggle = document.getElementById('video-audio-toggle');
  const slidingText = document.getElementById('sliding-text');
  const clock = document.getElementById('display-clock');
  const gregorianDate = document.getElementById('gregorian-date');
  const calendarEvents = document.getElementById('calendar-events');
  const eventTitle = document.getElementById('event-countdown-title');
  const eventTime = document.getElementById('event-countdown-time');
  const soundToggle = document.getElementById('alert-sound-toggle');
  let displayData = { slides: [], slidingText: '', settings: {}, events: [] };
  let slides = displayData.slides;
  let events = displayData.events;
  let currentIndex = 0;
  let playbackId = 0;
  let timerId = null;
  let youtubePlayer = null;
  let youtubeAudioEnabled = true;
  let alertAudioContext = null;
  let alertSoundEnabled = false;
  let lastEventBeep = '';

  function enableCurrentVideoAudio() {
    if (youtubePlayer) {
      youtubeAudioEnabled = true;
      youtubePlayer.unMute();
      youtubePlayer.playVideo();
      videoAudioToggle.hidden = true;
      return;
    }

    const video = stage.querySelector('video');
    if (video) {
      video.muted = false;
      void video.play().then(() => {
        videoAudioToggle.hidden = true;
      }).catch((error) => {
        videoAudioToggle.hidden = false;
        console.warn('Unable to start video audio.', error);
      });
    }
  }

  function setSoundEnabled(enabled) {
    alertSoundEnabled = enabled;
    if (!soundToggle) {
      return;
    }
    soundToggle.textContent = enabled ? 'Sound on' : 'Enable sound';
    soundToggle.setAttribute('aria-pressed', String(enabled));
  }

  async function toggleEventSound() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      soundToggle.textContent = 'Sound unavailable';
      return;
    }

    try {
      if (!alertAudioContext) {
        alertAudioContext = new AudioContextConstructor();
      }
      if (alertSoundEnabled) {
        await alertAudioContext.suspend();
        setSoundEnabled(false);
      } else {
        await alertAudioContext.resume();
        setSoundEnabled(alertAudioContext.state === 'running');
      }
    } catch (error) {
      soundToggle.textContent = 'Sound unavailable';
      console.warn('Unable to enable event alert sound.', error);
    }
  }

  function beepForEvent() {
    if (!alertSoundEnabled || alertAudioContext?.state !== 'running') {
      return;
    }
    const oscillator = alertAudioContext.createOscillator();
    const gain = alertAudioContext.createGain();
    const now = alertAudioContext.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    oscillator.connect(gain);
    gain.connect(alertAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.17);
  }

  function formatEventTimeRemaining(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const time = [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
    return days ? `${days}d ${time}` : time;
  }

  function openPrayerPageForEvent(event) {
    try {
      window.sessionStorage.setItem('collegeDisplay.activeEvent', JSON.stringify(event));
    } catch (error) {
      console.warn('Unable to stage the pinned event for the prayer page.', error);
    }
    const url = new URL('misc/prayer-times.html', window.location.href);
    url.searchParams.set('eventMode', '1');
    url.searchParams.set('eventId', event.id);
    url.searchParams.set('returnTo', '../index.html');
    window.location.assign(url.href);
  }

  function updateEventCountdown() {
    const now = Date.now();
    const upcoming = events
      .map((event) => ({ ...normalizeEvent(event), startsAtMs: Date.parse(event.startsAt) }))
      .filter((event) => Number.isFinite(event.startsAtMs) && event.startsAtMs > now - 1000)
      .sort((left, right) => left.startsAtMs - right.startsAtMs)[0];

    if (!upcoming) {
      eventTitle.textContent = 'NO UPCOMING EVENTS';
      eventTime.textContent = '';
      lastEventBeep = '';
      return;
    }

    const remaining = upcoming.startsAtMs - now;
    eventTitle.textContent = upcoming.title;
    eventTime.textContent = remaining > 10000
      ? formatEventTimeRemaining(remaining)
      : `STARTS IN ${formatEventTimeRemaining(remaining)}`;

    if (remaining <= 0) {
      openPrayerPageForEvent(upcoming);
      return;
    }

    const secondsRemaining = Math.ceil(remaining / 1000);
    if (secondsRemaining <= 10) {
      const beepToken = `${upcoming.id}:${secondsRemaining}`;
      if (lastEventBeep !== beepToken) {
        lastEventBeep = beepToken;
        beepForEvent();
      }
    } else {
      lastEventBeep = '';
    }
  }

  function updateClockAndDate() {
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
      timeZone: DISPLAY_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(now);
    gregorianDate.textContent = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
      timeZone: DISPLAY_TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);
  }

  function renderCalendarEvents() {
    if (!calendarEvents) {
      return;
    }

    const now = Date.now();
    const upcoming = events
      .map((event) => ({ ...normalizeEvent(event), startsAtMs: Date.parse(event.startsAt) }))
      .filter((event) => event.title && Number.isFinite(event.startsAtMs) && event.startsAtMs > now - 1000)
      .sort((left, right) => left.startsAtMs - right.startsAtMs)
      .slice(0, 3);

    if (!upcoming.length) {
      const empty = document.createElement('li');
      empty.className = 'calendar-empty';
      empty.textContent = 'No upcoming events';
      calendarEvents.replaceChildren(empty);
      return;
    }

    const formatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
      timeZone: DISPLAY_TIME_ZONE,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit'
    });
    const items = upcoming.map((event) => {
      const item = document.createElement('li');
      const time = document.createElement('time');
      const title = document.createElement('span');
      time.dateTime = event.startsAt;
      time.textContent = formatter.format(new Date(event.startsAtMs));
      title.textContent = event.title;
      item.append(time, title);
      return item;
    });
    calendarEvents.replaceChildren(...items);
  }

  function applyDashboardData() {
    renderDashboardAnnouncements(slides);
    renderTimetable(displayData.settings.timetableUrl);
    renderCalendarEvents();
    if (slidingText) {
      const tickerMessage = displayData.slidingText || '* EVERY SUNDAY: Community Gathering *';
      slidingText.hidden = !tickerMessage;
      renderTickerAnnouncements(slidingText, tickerMessage);
      slidingText.style.setProperty(
        '--ticker-duration',
        `${Math.max(5, Number(displayData.settings.tickerDuration) || 24)}s`
      );
    }
  }

  function advance(playback) {
    if (playback !== playbackId || !slides.length) {
      return;
    }
    window.clearTimeout(timerId);
    if (youtubePlayer) {
      youtubePlayer.destroy();
      youtubePlayer = null;
    }
    currentIndex = (currentIndex + 1) % slides.length;
    showCurrent();
  }

  function showCurrent() {
    applyDashboardData();
    const playback = ++playbackId;
    videoAudioToggle.hidden = true;
    window.clearTimeout(timerId);
    if (youtubePlayer) {
      youtubePlayer.destroy();
      youtubePlayer = null;
    }

    if (!slides.length) {
      stage.replaceChildren(emptyState);
      emptyState.hidden = false;
      return;
    }

    const slide = slides[currentIndex];
    const videoId = youtubeVideoId(slide.videoUrl);
    youtubeAudioEnabled = true;
    emptyState.hidden = true;

    if (videoId) {
      const mount = document.createElement('div');
      mount.id = 'youtube-player';
      stage.replaceChildren(mount);
      const youtubeOrigin = /^https?:$/.test(window.location.protocol)
        ? window.location.origin
        : '';
      loadYouTubeApi().then((youtube) => {
        if (playback !== playbackId) {
          return;
        }
        youtubePlayer = new youtube.Player(mount, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            ...(youtubeOrigin ? { origin: youtubeOrigin } : {})
          },
          events: {
            onReady: (event) => {
              event.target.unMute();
              event.target.playVideo();
            },
            onStateChange: (event) => {
              if (event.data === youtube.PlayerState.PLAYING) {
                videoAudioToggle.hidden = youtubeAudioEnabled;
              } else if (event.data === youtube.PlayerState.ENDED) {
                advance(playback);
              }
            },
            onAutoplayBlocked: () => {
              youtubeAudioEnabled = false;
              youtubePlayer?.mute();
              youtubePlayer?.playVideo();
              videoAudioToggle.hidden = false;
            },
            onError: (event) => console.warn('YouTube playback failed.', event.data)
          }
        });
      }).catch((error) => console.warn('Unable to load YouTube playback.', error));
      return;
    }

    if (slide.videoUrl && !slide.imageUrl) {
      const videoUrl = safeHttpsUrl(slide.videoUrl);
      if (videoUrl) {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.autoplay = true;
        video.muted = false;
        video.playsInline = true;
        video.addEventListener('ended', () => advance(playback), { once: true });
        stage.replaceChildren(video);
        void video.play().then(() => {
          videoAudioToggle.hidden = true;
        }).catch((error) => {
          videoAudioToggle.hidden = false;
          if (error.name === 'NotAllowedError') {
            video.muted = true;
            void video.play().catch((fallbackError) => {
              console.warn('Muted video autoplay was blocked.', fallbackError);
            });
            return;
          }
          console.warn('Video autoplay failed.', error);
        });
      } else {
        stage.replaceChildren(emptyState);
      }
      return;
    }

    if (safeHttpsUrl(slide.imageUrl)) {
      const image = document.createElement('img');
      image.className = `announcement-image template-${slide.template}`;
      image.src = safeHttpsUrl(slide.imageUrl);
      image.alt = slide.title || `${DISPLAY_NAME} announcement`;
      image.draggable = false;
      stage.replaceChildren(image);
    } else {
      stage.replaceChildren(emptyState);
      emptyState.hidden = false;
    }
    timerId = window.setTimeout(() => advance(playback), 5000);
  }

  updateClockAndDate();
  window.setInterval(updateClockAndDate, 30000);
  videoAudioToggle.addEventListener('click', enableCurrentVideoAudio);
  if (soundToggle) {
    soundToggle.addEventListener('click', () => void toggleEventSound());
    setSoundEnabled(false);
  }
  void updatePrayerTimes();
  window.setInterval(updatePrayerTimes, 60 * 60 * 1000);
  updateEventCountdown();
  window.setInterval(updateEventCountdown, 250);
  showCurrent();

  let lastFeed = JSON.stringify(displayData);
  let feedRefreshInProgress = false;
  async function refreshDisplayFeed() {
    if (feedRefreshInProgress) {
      return;
    }
    feedRefreshInProgress = true;
    try {
      const latestData = await loadDisplayData();
      if (lastBackendError) {
        return;
      }
      const latestFeed = JSON.stringify(latestData);
      if (latestFeed === lastFeed) {
        return;
      }
      lastFeed = latestFeed;
      displayData = latestData;
      slides = latestData.slides;
      events = latestData.events;
      currentIndex = 0;
      showCurrent();
    } finally {
      feedRefreshInProgress = false;
    }
  }

  void refreshDisplayFeed();
  window.setInterval(() => void refreshDisplayFeed(), 10000);
}

const BACKEND_API_BASE = String(APP_CONFIG.backendApiBase || '').trim();
const BACKEND_DATA_ENDPOINT = String(APP_CONFIG.backendDataPath || '/feed');
const BACKEND_SAVE_ENDPOINT = String(APP_CONFIG.backendSavePath || BACKEND_DATA_ENDPOINT);
let lastBackendError = null;

function normalizeSlide(slide = {}) {
  return {
    title: slide.title || '',
    message: slide.slidingText || slide['sliding text'] || slide.message || slide.text || '',
    imageUrl: slide.imageUrl || slide.picture || slide.image || '',
    videoUrl: slide.videoUrl || slide.youtubeUrl || slide.youtube || slide.video || '',
    duration: 5,
    caption: slide.caption || '',
    template: Math.min(10, Math.max(1, Number(slide.template) || 1))
  };
}

function normalizeEvent(event = {}) {
  const title = String(event.title || '').trim();
  const startsAt = String(event.startsAt || event.dateTime || '');
  const pinnedImageUrl = String(event.pinnedImageUrl || event.imageUrl || '');
  return {
    id: String(event.id || `${title}-${startsAt}`),
    title,
    startsAt,
    pinnedImageUrl
  };
}

const defaultSettings = {
  accentColor: '#6cc3ff',
  accentSoftColor: '#2f7fd3',
  backgroundColor: '#020814',
  surfaceColor: '#071222',
  textColor: '#eff7ff',
  mutedColor: '#9bb3cc',
  slideTitleSize: '2.5',
  slideMessageSize: '1.15',
  overlayOpacity: '0.82',
  tickerDuration: '20',
  announcementCount: '6'
};

const BACKEND_REQUEST_TIMEOUT_MS = 35000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Backend did not respond within ${BACKEND_REQUEST_TIMEOUT_MS / 1000} seconds`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchBackendData() {
  if (!BACKEND_API_BASE.trim()) {
    return null;
  }

  try {
    const response = await fetchWithTimeout(new URL(BACKEND_DATA_ENDPOINT, BACKEND_API_BASE), {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: HTTP ${response.status}`);
    }

    lastBackendError = null;
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  } catch (error) {
    lastBackendError = error;
    console.warn('Backend fetch failed.', error);
    return null;
  }
}

function buildAnnouncementsFromSlides(slides) {
  return slides.map((slide, index) => ({
    title: slide.title || `Update ${index + 1}`,
    message: slide.message || '',
    note: slide.caption || '',
    imageUrl: slide.imageUrl || '',
    videoUrl: slide.videoUrl || '',
    template: slide.template || 1
  }));
}

function applyDisplaySettings(settings = {}) {
  const theme = { ...defaultSettings, ...settings };
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.accentColor);
  root.style.setProperty('--accent-soft', theme.accentSoftColor);
  root.style.setProperty('--bg', theme.backgroundColor);
  root.style.setProperty('--surface', theme.surfaceColor);
  root.style.setProperty('--text', theme.textColor);
  root.style.setProperty('--muted', theme.mutedColor);
  root.style.setProperty('--overlay-opacity', theme.overlayOpacity);
  root.style.setProperty('--title-size', `${theme.slideTitleSize}rem`);
  root.style.setProperty('--message-size', `${theme.slideMessageSize}rem`);
}

async function loadSlides() {
  if (BACKEND_API_BASE.trim()) {
    const backendData = await fetchBackendData();
    if (Array.isArray(backendData)) {
      return backendData.map(normalizeSlide);
    }
    if (backendData && Array.isArray(backendData.slides)) {
      return backendData.slides.map(normalizeSlide);
    }
  }

  return [];
}

function slidesFromFeed(data) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of ['slides', 'items', 'pictures', 'announcements']) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const message = data.slidingText || data['sliding text'] || data.message || data.text || '';
  const videoUrl = data.videoUrl || data.youtubeUrl || data.youtube || data.video || '';
  const imageUrl = data.imageUrl || data.picture || data.image || '';
  const template = data.template || 1;

  return [
    ...(videoUrl ? [{ videoUrl, message, template }] : []),
    ...(imageUrl ? [{ imageUrl, message, template }] : [])
  ];
}

async function loadDisplayData() {
  const backendData = await fetchBackendData();
  const slidingText = backendData?.slidingText || backendData?.['sliding text'] || backendData?.newsText || backendData?.settings?.slidingText || backendData?.settings?.footerNews || '';

  return {
    slides: slidesFromFeed(backendData).flatMap((item) => {
      const slide = normalizeSlide(item);
      if (slide.videoUrl && slide.imageUrl) {
        return [
          { ...slide, imageUrl: '' },
          { ...slide, videoUrl: '' }
        ];
      }
      return [slide];
    }),
    slidingText,
    settings: backendData?.settings || {},
    events: Array.isArray(backendData?.events) ? backendData.events.map(normalizeEvent) : []
  };
}

async function persistSlidesToBackend(slides, settings = {}, events = []) {
  const tickerText = String(settings.footerNews || settings.slidingText || '').trim();
  const payload = {
    slides: slides.map(normalizeSlide),
    announcements: buildAnnouncementsFromSlides(slides),
    events: events.map(normalizeEvent),
    settings: { ...settings, footerNews: tickerText, slidingText: tickerText },
    slidingText: tickerText,
    newsText: tickerText
  };
  let lastError;

  for (const method of ['PUT', 'POST']) {
    try {
      const response = await fetchWithTimeout(new URL(BACKEND_SAVE_ENDPOINT, BACKEND_API_BASE), {
        method,
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        const savedData = await fetchBackendData();
        if (savedData !== null) {
          const savedSlides = Array.isArray(savedData)
            ? savedData.map(normalizeSlide)
            : Array.isArray(savedData.slides)
              ? savedData.slides.map(normalizeSlide)
              : [];
          const contentMatches = JSON.stringify(savedSlides.map((slide) => ({
            title: slide.title,
            message: slide.message,
            imageUrl: slide.imageUrl,
            videoUrl: slide.videoUrl,
            template: slide.template
          }))) === JSON.stringify(payload.slides.map((slide) => ({
            title: slide.title,
            message: slide.message,
            imageUrl: slide.imageUrl,
            videoUrl: slide.videoUrl,
            template: slide.template
          })));

          const savedSettings = savedData?.settings || {};
          const savedEvents = Array.isArray(savedData?.events) ? savedData.events.map(normalizeEvent) : [];
          const eventsMatch = JSON.stringify(savedEvents) === JSON.stringify(payload.events);
          const settingsMatch = ['footerNews', 'slidingText', 'tickerDuration', 'timetableUrl']
            .every((key) => String(savedSettings[key] || '') === String(payload.settings[key] || ''));

          if (contentMatches && eventsMatch && settingsMatch) {
            lastBackendError = null;
            return;
          }
          lastError = new Error(`${method} returned success but the database did not contain the submitted content, events, and settings`);
        } else {
          lastError = new Error(`${method} returned success but the saved feed could not be read back`);
        }
      } else {
        lastError = new Error(`${method} save failed: HTTP ${response.status}`);
      }
    } catch (error) {
      lastError = error;
    }
  }

  lastBackendError = lastError;
  throw lastError || new Error('Backend save failed.');
}

async function initSolatPage() {
  const clock = document.getElementById('solat-clock');
  const gregorianDate = document.getElementById('solat-date');
  const hijriDate = document.getElementById('solat-hijri-date');
  const status = document.getElementById('solat-status');
  const query = new URLSearchParams(window.location.search);
  const eventMode = query.get('eventMode') === '1';

  function updateClock() {
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
      timeZone: DISPLAY_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(now);
    gregorianDate.textContent = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
      timeZone: DISPLAY_TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);
    if (currentPrayerSchedule) {
      updatePrayerCountdown(currentPrayerSchedule);
    }
  }

  function renderSchedule(schedule) {
    const entries = [
      ['fajr', 'Fajr'],
      ['syuruk', 'Sunrise'],
      ['dhuhr', 'Dhuhr'],
      ['asr', 'Asar'],
      ['maghrib', 'Maghrib'],
      ['isha', 'Isha']
    ];
    entries.forEach(([key]) => {
      const time = document.querySelector(`.solat-prayer-time[data-prayer="${key}"] time`);
      if (time) {
        time.textContent = String(schedule[key] || '--:--').slice(0, 5);
      }
    });
    hijriDate.textContent = formatHijriDate(schedule.hijri);
    currentPrayerSchedule = schedule;
    updatePrayerCountdown(schedule);
    status.textContent = APP_CONFIG.prayerTimesLabel || 'Configured location';
  }

  async function loadSchedule() {
    if (!PRAYER_TIMES_ENDPOINT) {
      status.textContent = 'Configure the prayer feed in config.js';
      return;
    }
    try {
      renderSchedule(await prayerScheduleForToday());
    } catch (error) {
      status.textContent = 'Prayer times unavailable';
      console.warn('Unable to load the configured prayer schedule.', error);
    }
  }

  updateClock();
  window.setInterval(updateClock, 1000);
  void loadSchedule();
  window.setInterval(() => void loadSchedule(), 60 * 60 * 1000);

  if (eventMode && query.get('returnTo') === '../index.html') {
    const eventBanner = document.getElementById('solat-event-banner');
    const eventTitle = document.getElementById('solat-event-title');
    const eventImage = document.getElementById('solat-event-image');
    const returnNotice = document.getElementById('solat-return-notice');
    const returnCountdown = document.getElementById('solat-return-countdown');
    const returnAt = Date.now() + 60 * 1000;
    let returnStarted = false;
    returnNotice.hidden = false;

    function updateReturnCountdown() {
      const remaining = Math.max(0, Math.ceil((returnAt - Date.now()) / 1000));
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      returnCountdown.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      if (remaining === 0 && !returnStarted) {
        returnStarted = true;
        window.location.replace('../index.html');
      }
    }

    updateReturnCountdown();
    window.setInterval(updateReturnCountdown, 250);
    const requestedEventId = query.get('eventId');
    let stagedEvent = null;
    try {
      const serializedEvent = window.sessionStorage.getItem('collegeDisplay.activeEvent');
      stagedEvent = serializedEvent ? normalizeEvent(JSON.parse(serializedEvent)) : null;
      window.sessionStorage.removeItem('collegeDisplay.activeEvent');
    } catch (error) {
      console.warn('Unable to restore the pinned event for Prayer Times.', error);
    }

    function renderEvent(event) {
      if (!event || event.id !== requestedEventId) {
        return;
      }
      eventBanner.hidden = false;
      eventTitle.textContent = event.title;
      const imageUrl = safeHttpsUrl(event.pinnedImageUrl);
      eventBanner.classList.toggle('has-image', Boolean(imageUrl));
      eventImage.hidden = !imageUrl;
      if (imageUrl) {
        eventImage.src = imageUrl;
        eventImage.alt = event.title;
      } else {
        eventImage.removeAttribute('src');
        eventImage.alt = '';
      }
    }

    renderEvent(stagedEvent);
    void loadDisplayData().then((data) => {
      const event = data.events.find((item) => item.id === requestedEventId);
      renderEvent(event);
    });
  }
}

function initMaintenancePage() {
  const clock = document.getElementById('maintenance-clock');
  const date = document.getElementById('maintenance-date');
  function updateMaintenanceClock() {
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
      timeZone: DISPLAY_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(now);
    date.textContent = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
      timeZone: DISPLAY_TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(now);
  }
  updateMaintenanceClock();
  window.setInterval(updateMaintenanceClock, 1000);
}

function applyConfigBranding() {
  const pageTitles = [
    ['display-page', 'Information Display'],
    ['admin-page', 'Display Admin'],
    ['solat-page', 'Prayer Schedule'],
    ['maintenance-page', 'Maintenance']
  ];
  const pageTitle = pageTitles.find(([pageClass]) => document.body.classList.contains(pageClass));
  if (pageTitle) {
    document.title = `${DISPLAY_NAME} | ${pageTitle[1]}`;
  }
  document.querySelectorAll('[data-college-name]').forEach((element) => {
    element.textContent = DISPLAY_NAME;
  });
  document.querySelectorAll('[data-college-footer]').forEach((element) => {
    element.textContent = `\u00a9 ${DISPLAY_NAME}`;
  });
}

async function initAdminPage() {
  const videoForm = document.getElementById('slide-form');
  const announcementForm = document.getElementById('announcement-form');
  const settingsForm = document.getElementById('settings-form');
  const slideList = document.getElementById('slide-list');
  const status = document.getElementById('admin-status');
  const importJson = document.getElementById('import-json');
  const footerNewsInput = document.getElementById('footer-news');
  const videoTitleInput = document.getElementById('slide-title');
  const videoMessageInput = document.getElementById('slide-message');
  const videoUrlInput = document.getElementById('slide-video');
  const videoDurationInput = document.getElementById('slide-duration');
  const announcementTitleInput = document.getElementById('announcement-title');
  const announcementMessageInput = document.getElementById('announcement-message');
  const announcementImageInput = document.getElementById('announcement-image');
  const announcementSectionInput = document.getElementById('announcement-section');
  const announcementDurationInput = document.getElementById('announcement-duration');
  const tickerDurationInput = document.getElementById('ticker-duration');
  const timetableInput = document.getElementById('timetable-url');
  const eventForm = document.getElementById('event-form');
  const eventTitleInput = document.getElementById('event-title');
  const eventStartsAtInput = document.getElementById('event-starts-at');
  const eventImageUrlInput = document.getElementById('event-image-url');
  const eventList = document.getElementById('event-list');
  const eventSaveButton = document.getElementById('event-save-button');
  const eventCancelButton = document.getElementById('event-cancel-button');

  let slides = [];
  let events = [];
  let editingEventId = '';
  let settings = {
    footerNews: '',
    slidingText: '',
    tickerDuration: '24',
    timetableUrl: ''
  };

  function setStatus(message, state = '') {
    status.textContent = message;
    status.dataset.state = state;
  }

  function updateSlideList() {
    slideList.replaceChildren();
    slides.forEach((slide, index) => {
      const card = document.createElement('div');
      card.className = 'slide-card';
      const info = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = slide.title || `Slide ${index + 1}`;
      const details = document.createElement('span');
      details.textContent = slide.videoUrl ? 'Video' : 'Picture';
      info.append(title, details);

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'button button-secondary';
      removeButton.textContent = 'Delete';
      removeButton.addEventListener('click', async () => {
        slides.splice(index, 1);
        updateSlideList();
        await saveFeed();
      });

      card.append(info, removeButton);
      slideList.appendChild(card);
    });
    if (!slides.length) {
      const empty = document.createElement('p');
      empty.className = 'note';
      empty.textContent = 'No media items in the backend feed.';
      slideList.appendChild(empty);
    }
  }

  function resetEventForm() {
    editingEventId = '';
    eventForm.reset();
    eventSaveButton.textContent = 'Add event';
    eventCancelButton.hidden = true;
  }

  function updateEventList() {
    eventList.replaceChildren();
    if (!events.length) {
      const empty = document.createElement('p');
      empty.className = 'note';
      empty.textContent = 'No scheduled events.';
      eventList.appendChild(empty);
      return;
    }

    events.forEach((event) => {
      const card = document.createElement('div');
      card.className = 'event-card';
      const info = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = event.title;
      const date = document.createElement('span');
      const startsAt = new Date(event.startsAt);
      date.textContent = Number.isFinite(startsAt.getTime())
        ? new Intl.DateTimeFormat(DISPLAY_LOCALE, {
          timeZone: DISPLAY_TIME_ZONE,
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(startsAt)
        : 'Invalid event date';
      info.append(title, date);

      const actions = document.createElement('div');
      actions.className = 'button-row';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'button button-secondary';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => {
        editingEventId = event.id;
        eventTitleInput.value = event.title;
        eventStartsAtInput.value = configuredDateTimeInputValue(event.startsAt);
        eventImageUrlInput.value = event.pinnedImageUrl;
        eventSaveButton.textContent = 'Save event';
        eventCancelButton.hidden = false;
        eventTitleInput.focus();
      });

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'button button-secondary';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', async () => {
        events = events.filter((item) => item.id !== event.id);
        if (editingEventId === event.id) {
          resetEventForm();
        }
        updateEventList();
        await saveFeed();
      });

      actions.append(editButton, deleteButton);
      card.append(info, actions);
      eventList.appendChild(card);
    });
  }

  async function saveFeed() {
    setStatus('Saving to backend...');
    try {
      await persistSlidesToBackend(slides, settings, events);
      setStatus('Saved to backend.', 'success');
      updateSlideList();
      updateEventList();
    } catch (error) {
      setStatus(`Save failed: ${error.message}. Check the backend and CORS settings.`, 'error');
    }
  }

  videoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    slides.push(normalizeSlide({
      title: videoTitleInput.value.trim(),
      message: videoMessageInput.value.trim(),
      videoUrl: videoUrlInput.value.trim(),
      duration: Number(videoDurationInput.value) || 5
    }));
    videoForm.reset();
    videoDurationInput.value = 5;
    updateSlideList();
    await saveFeed();
  });

  announcementForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = announcementTitleInput.value.trim();
    const section = announcementSectionInput.value;
    slides = slides.filter((slide) => String(slide.caption || '').trim().toLowerCase() !== section);
    slides.push(normalizeSlide({
      title,
      message: announcementMessageInput.value.trim() || title,
      imageUrl: announcementImageInput.value.trim(),
      duration: Number(announcementDurationInput.value) || 5,
      caption: section
    }));
    announcementForm.reset();
    announcementDurationInput.value = 5;
    updateSlideList();
    await saveFeed();
  });

  eventForm.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    const pinnedImageUrl = eventImageUrlInput.value.trim();
    if (pinnedImageUrl && !safeHttpsUrl(pinnedImageUrl)) {
      setStatus('Pinned picture must be a valid HTTPS URL.', 'error');
      return;
    }

    let startsAt;
    try {
      startsAt = dateTimeInputToIso(eventStartsAtInput.value);
    } catch (error) {
      setStatus(error.message, 'error');
      return;
    }
    const eventId = editingEventId || `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const updatedEvent = normalizeEvent({
      id: eventId,
      title: eventTitleInput.value.trim(),
      startsAt,
      pinnedImageUrl
    });
    events = editingEventId
      ? events.map((item) => item.id === editingEventId ? updatedEvent : item)
      : [...events, updatedEvent];
    events.sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt));
    resetEventForm();
    updateEventList();
    await saveFeed();
  });

  eventCancelButton.addEventListener('click', resetEventForm);

  settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const timetableUrl = timetableInput.value.trim();
    if (timetableUrl && !safeHttpsUrl(timetableUrl)) {
      setStatus('Timetable embed must be a valid HTTPS URL.', 'error');
      return;
    }
    settings = {
      ...settings,
      footerNews: footerNewsInput.value.trim(),
      slidingText: footerNewsInput.value.trim(),
      tickerDuration: tickerDurationInput.value,
      timetableUrl
    };
    await saveFeed();
  });

  document.getElementById('clear-btn').addEventListener('click', () => videoForm.reset());
  document.getElementById('clear-announcement-btn').addEventListener('click', () => announcementForm.reset());
  document.getElementById('export-btn').addEventListener('click', () => {
    importJson.value = JSON.stringify({ slides, events, settings }, null, 2);
  });
  document.getElementById('import-btn').addEventListener('click', async () => {
    try {
      const parsed = JSON.parse(importJson.value);
      slides = slidesFromFeed(parsed).map(normalizeSlide);
      events = Array.isArray(parsed.events) ? parsed.events.map(normalizeEvent) : events;
      settings = { ...settings, ...(parsed.settings || {}) };
      const tickerText = parsed.slidingText || parsed.newsText || settings.slidingText || settings.footerNews || '';
      settings.footerNews = tickerText;
      settings.slidingText = tickerText;
      updateSlideList();
      updateEventList();
      await saveFeed();
    } catch (error) {
      setStatus(`Import failed: ${error.message}`, 'error');
    }
  });

  const backendData = await fetchBackendData();
  slides = slidesFromFeed(backendData).map(normalizeSlide);
  events = Array.isArray(backendData?.events) ? backendData.events.map(normalizeEvent) : [];
  settings = { ...settings, ...(backendData?.settings || {}) };
  const tickerText = backendData?.slidingText || backendData?.newsText || settings.slidingText || settings.footerNews || '';
  settings.footerNews = tickerText;
  settings.slidingText = tickerText;
  footerNewsInput.value = tickerText;
  tickerDurationInput.value = settings.tickerDuration || 24;
  timetableInput.value = settings.timetableUrl || '';
  updateSlideList();
  updateEventList();
  if (!BACKEND_API_BASE.trim()) {
    setStatus('Set backendApiBase in config.js to connect a backend.', 'error');
  } else if (lastBackendError) {
    setStatus(`Could not load backend feed: ${lastBackendError.message}`, 'error');
  } else {
    setStatus(`Loaded ${slides.length} media item${slides.length === 1 ? '' : 's'}.`, 'success');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  applyConfigBranding();
  if (document.body.classList.contains('display-page')) {
    void initFeedDisplayPage();
  }
  if (document.body.classList.contains('solat-page')) {
    void initSolatPage();
  }
  if (document.body.classList.contains('maintenance-page')) {
    initMaintenancePage();
  }
  if (document.body.classList.contains('admin-page')) {
    void initAdminPage();
  }
});
