"""LR3 slider settings.

The slider is constructed in JavaScript (pharmacy/static/pharmacy/js/slider.js).
Its options are stored in the Django session so an administrator can change the
delay and flags through a normal HTML form without editing source code.

Only the server-side view (pharmacy.views.slider_settings_view) may call
save_slider_settings(), and that view is restricted to the OWNER role. The
defaults below are used for anonymous visitors and for customers/employees.
"""

DEFAULT_SLIDER_SETTINGS = {
    'loop': True,
    'navs': True,
    'pags': True,
    'auto': True,
    'stop_mouse_hover': True,
    'delay': 5,
}

BOOLEAN_KEYS = ('loop', 'navs', 'pags', 'auto', 'stop_mouse_hover')


def _clamp_delay(value):
    """Return a safe delay in seconds (1..60); fall back to 5 on bad input."""
    try:
        delay = int(value)
    except (TypeError, ValueError):
        return DEFAULT_SLIDER_SETTINGS['delay']
    return max(1, min(60, delay))


def get_slider_settings(request):
    """Merge session overrides with defaults and return a plain dict."""
    settings = dict(DEFAULT_SLIDER_SETTINGS)
    stored = request.session.get('slider_settings')
    if not isinstance(stored, dict):
        return settings

    for key in BOOLEAN_KEYS:
        if key in stored:
            settings[key] = bool(stored[key])
    if 'delay' in stored:
        settings['delay'] = _clamp_delay(stored['delay'])
    return settings


def save_slider_settings(request, payload):
    """Validate and persist slider settings in the current session."""
    settings = dict(DEFAULT_SLIDER_SETTINGS)
    for key in BOOLEAN_KEYS:
        settings[key] = bool(payload.get(key))
    settings['delay'] = _clamp_delay(payload.get('delay'))
    request.session['slider_settings'] = settings
    return settings
