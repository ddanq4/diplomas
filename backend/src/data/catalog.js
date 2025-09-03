export const FACULTIES = {
    economics: {
        name: 'Економічний',
        specialties: [
            { code: '051', name: 'Економіка' },
            { code: '071', name: 'Облік і оподаткування' },
            { code: '072', name: 'Фінанси, банківська справа та страхування' },
            { code: '073', name: 'Менеджмент' },
            { code: '075', name: 'Маркетинг' },
            { code: '076', name: 'Підприємництво, торгівля та біржова діяльність' },
        ],
    },
    math: {
        name: 'Математики і інформатики',
        specialties: [
            { code: '111', name: 'Математика' },
            { code: '113', name: 'Прикладна математика' },
            { code: '014.04', name: 'Середня освіта (математика)' },
        ],
    },
    csd: {
        name: 'ННІ компʼютерних наук та ШІ',
        specialties: [
            { code: '125', name: 'Кібербезпека' },
            { code: '122', name: 'Комп’ютерні науки' },
            { code: '151', name: 'Автоматизація та КІТ' },
            { code: '174', name: 'Автоматизація, КІТ та робототехніка' },
        ],
    },
    law: {
        name: 'Юридичний',
        specialties: [
            { code: '081', name: 'Право' },
            { code: '293', name: 'Міжнародне право' },
        ],
    },
    biology: {
        name: 'Біологічний',
        specialties: [
            { code: '091', name: 'Біологія' },
            { code: '162', name: 'Біотехнології та біоінженерія' },
            { code: '014.05', name: 'Середня освіта (біологія та здоровʼя людини)' },
        ],
    },
};

export function getFacultySpecialtyNames(key) {
    const f = FACULTIES[key];
    return f ? f.specialties.map(s => s.name) : [];
}
