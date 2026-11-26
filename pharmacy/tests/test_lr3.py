"""Минимальные регрессионные тесты для новых точек ЛР3."""

import pytest
from django.urls import reverse

from pharmacy.models import ContactPerson


@pytest.mark.django_db
def test_contact_api_returns_active_contacts(client):
    ContactPerson.objects.create(
        full_name='Тестовый Контакт',
        job_description='Консультации.',
        phone='+375 (29) 111-22-33',
        email='test@example.by',
        is_active=True,
    )
    ContactPerson.objects.create(
        full_name='Скрытый Контакт',
        job_description='Не должен попасть в API.',
        phone='+375 (29) 111-22-44',
        email='hidden@example.by',
        is_active=False,
    )
    response = client.get(reverse('pharmacy:contact_api'))
    assert response.status_code == 200
    results = response.json()['results']
    assert len(results) == 1
    assert results[0]['full_name'] == 'Тестовый Контакт'


def test_js_lab_renders_chart_data(client):
    response = client.get(reverse('pharmacy:js_lab'))
    content = response.content.decode()
    assert response.status_code == 200
    assert 'id="chart-data"' in content
    assert 'Задание 8' in content
    assert 'Задание 9' in content
    assert 'Задание 10' in content


def test_slider_settings_are_forbidden_for_anonymous(client):
    response = client.post(
        reverse('pharmacy:slider_settings'),
        {'delay': '9'},
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_owner_can_change_slider_delay(client, owner_user):
    client.force_login(owner_user)
    response = client.post(
        reverse('pharmacy:slider_settings'),
        {
            'delay': '7',
            'loop': 'on',
            'navs': 'on',
            'pags': 'on',
            'auto': 'on',
            'stop_mouse_hover': 'on',
        },
    )
    assert response.status_code == 302
    home = client.get(reverse('pharmacy:home'))
    assert home.status_code == 200
    assert b'"delay": 7' in home.content
