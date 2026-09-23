const button = document.querySelector('.menu-button');
const nav = document.querySelector('.nav');
if (button && nav) {
  button.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });
}

// Keep concise supervision labels and surface the current funded position.
const supervisionHeadings = document.querySelectorAll('.supervision-group > h3');
if (supervisionHeadings[0]) supervisionHeadings[0].textContent = 'Ongoing';
if (supervisionHeadings[1]) supervisionHeadings[1].textContent = 'Former';

const opportunity = document.querySelector('#opportunities .opportunity');
if (opportunity) {
  const paragraphs = opportunity.querySelectorAll('p');
  const link = opportunity.querySelector('.button');
  if (paragraphs[2]) {
    paragraphs[2].textContent = 'A PhD position is currently open on composition operators and scientific machine learning. Follow the link for the project description, eligibility and application details.';
  }
  if (link) {
    link.href = 'https://www.edtlab.fr/en/positions/phd-pc1-phd1-compositionoperators';
    link.textContent = 'View open position';
  }
}

// Use the poster-derived Eye2Heart overlay on the research page.
const eye2heartFigure = document.querySelector('.eye2heart-visual');
if (eye2heartFigure) {
  eye2heartFigure.innerHTML = '';
  const image = document.createElement('img');
  image.src = 'eye2heart-model.png';
  image.alt = 'Overlaid anatomical and lumped-parameter representations of the Eye2Heart model, linking retinal and cardiovascular circulation';
  const caption = document.createElement('figcaption');
  caption.textContent = 'Eye2Heart overlays the physiological eye-to-heart pathway with its reduced mathematical circuit.';
  eye2heartFigure.append(image, caption);
}

const publicationList = document.querySelector('#hal-publications');
const halStatus = document.querySelector('#hal-status');
if (publicationList && halStatus) {
  const publicationHero = document.querySelector('.page-hero .container');
  if (publicationHero) {
    publicationHero.querySelector('.eyebrow')?.remove();
    publicationHero.querySelector('.lead')?.remove();
    const heading = publicationHero.querySelector('h1');
    if (heading) heading.textContent = 'Publications';
  }

  const typeLabels = {
    ART: 'Peer-reviewed research articles',
    COMM: 'Conference proceedings',
    POSTER: 'Conference posters',
    OUV: 'Books',
    COUV: 'Book chapters',
    DOUV: 'Book chapters',
    REPORT: 'Reports',
    THESE: 'Theses',
    HDR: 'Habilitation theses',
    PATENT: 'Patents',
    SOFTWARE: 'Software',
    PREPRINT: 'Preprints',
    UNDEFINED: 'Preprints'
  };
  const typeOrder = ['ART', 'COMM', 'POSTER', 'OUV', 'COUV', 'DOUV', 'PREPRINT', 'UNDEFINED', 'REPORT', 'THESE', 'HDR', 'PATENT', 'SOFTWARE'];

  const appendAuthors = (element, authorValue) => {
    const authors = Array.isArray(authorValue) ? authorValue : authorValue ? [authorValue] : [];
    let displayed = authors;
    let shortened = false;
    if (authors.length > 6) {
      displayed = authors.slice(0, 3);
      const lorenzo = authors.find((author) => /\b(?:lorenzo\s+sala|sala\s+lorenzo)\b/i.test(author));
      if (lorenzo && !displayed.includes(lorenzo)) displayed.push(lorenzo);
      shortened = true;
    }
    displayed.forEach((author, index) => {
      if (index) element.append(', ');
      const authorElement = /\b(?:lorenzo\s+sala|sala\s+lorenzo)\b/i.test(author)
        ? document.createElement('strong')
        : document.createElement('span');
      authorElement.textContent = author;
      element.append(authorElement);
    });
    if (shortened) element.append(' et al.');
  };

  const endpoint = 'https://api.archives-ouvertes.fr/search/?q=authIdHal_s%3Alorenzo-sala&fl=title_s,authFullName_s,producedDateY_i,journalTitle_s,conferenceTitle_s,uri_s,docType_s&sort=producedDate_tdate%20desc&rows=200&wt=json';
  fetch(endpoint)
    .then((response) => {
      if (!response.ok) throw new Error('HAL request failed');
      return response.json();
    })
    .then(({ response }) => {
      const documents = response?.docs || [];
      halStatus.textContent = '';
      const byYear = new Map();
      for (const record of documents) {
        const year = String(record.producedDateY_i || 'Undated');
        const type = record.docType_s || 'UNDEFINED';
        if (!byYear.has(year)) byYear.set(year, new Map());
        const byType = byYear.get(year);
        if (!byType.has(type)) byType.set(type, []);
        byType.get(type).push(record);
      }

      for (const [year, byType] of byYear) {
        const yearSection = document.createElement('section');
        yearSection.className = 'publication-year';
        const yearHeading = document.createElement('h2');
        yearHeading.textContent = year;
        yearSection.append(yearHeading);

        const sortedTypes = [...byType.keys()].sort((a, b) => {
          const aIndex = typeOrder.indexOf(a);
          const bIndex = typeOrder.indexOf(b);
          return (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex);
        });

        for (const type of sortedTypes) {
          const typeSection = document.createElement('section');
          typeSection.className = 'publication-type';
          const typeHeading = document.createElement('h3');
          typeHeading.textContent = typeLabels[type] || (type === 'OTHER' ? 'Other publications' : 'Preprints');
          typeSection.append(typeHeading);

          for (const record of byType.get(type)) {
            const article = document.createElement('article');
            article.className = 'publication';
            const title = document.createElement('h4');
            const link = document.createElement('a');
            link.href = record.uri_s || '#';
            link.textContent = Array.isArray(record.title_s) ? record.title_s[0] : record.title_s || 'Untitled publication';
            title.append(link);

            const authors = document.createElement('p');
            authors.className = 'publication-authors';
            appendAuthors(authors, record.authFullName_s);
            const venue = document.createElement('p');
            venue.className = 'publication-venue';
            venue.textContent = record.journalTitle_s || record.conferenceTitle_s || '';
            article.append(title, authors);
            if (venue.textContent) article.append(venue);
            typeSection.append(article);
          }
          yearSection.append(typeSection);
        }
        publicationList.append(yearSection);
      }
      if (!documents.length) halStatus.textContent = 'No HAL publications were returned.';
    })
    .catch(() => {
      halStatus.innerHTML = 'The live HAL list could not be loaded. <a href="https://hal.science/search/index/?q=authIdHal_s%3Alorenzo-sala">View the complete record on HAL</a>.';
    });
}
