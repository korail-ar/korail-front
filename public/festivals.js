const list = document.querySelector('#festival-list');
const status = document.querySelector('#festival-status');

function dateLabel(value) {
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

function card(festival) {
  const article = document.createElement('article');
  article.className = 'festival-card';
  if (festival.image) {
    const image = document.createElement('img');
    image.src = festival.image;
    image.alt = '';
    image.loading = 'lazy';
    article.append(image);
  }
  const details = document.createElement('div');
  details.className = 'festival-details';
  const badge = document.createElement('span');
  badge.className = 'status';
  badge.textContent = festival.status;
  const title = document.createElement('h2');
  title.textContent = festival.title;
  const period = document.createElement('p');
  period.textContent = `${dateLabel(festival.eventstartdate)} ~ ${dateLabel(festival.eventenddate)}`;
  details.append(badge, title, period);
  if (festival.addr1) {
    const address = document.createElement('p');
    address.textContent = festival.addr1;
    details.append(address);
  }
  article.append(details);
  return article;
}

try {
  const response = await fetch('/api/festivals', { cache: 'no-store' });
  if (!response.ok) throw new Error('축제 정보를 가져오지 못했습니다.');
  const { festivals } = await response.json();
  if (!Array.isArray(festivals)) throw new Error('축제 응답 형식이 올바르지 않습니다.');
  list.replaceChildren(...festivals.slice(0, 3).map(card));
  status.textContent = festivals.length ? '' : '현재 표시할 축제가 없습니다.';
} catch (error) {
  status.textContent = error.message;
}
