// Configuración por recurso de ordenamiento permitido y orden por defecto
const RESOURCE_CONFIG = {
  rooms: {
    allowedSorts: ['name', 'capacity', 'floor', 'createdAt'],
    defaultSort: { name: 1 },
    getSearchFilter: (search) => ({
      name: { $regex: search, $options: 'i' }
    })
  },
  bands: {
    allowedSorts: ['name', 'createdAt'],
    defaultSort: { name: 1 },
    getSearchFilter: (search) => ({
      name: { $regex: search, $options: 'i' }
    })
  },
  musicians: {
    allowedSorts: ['name', 'instrument', 'createdAt'],
    defaultSort: { name: 1 },
    getSearchFilter: (search) => ({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    })
  },
  bookings: {
    allowedSorts: ['date', 'startHour', 'createdAt'],
    defaultSort: { date: 1, startHour: 1 },
    getSearchFilter: (search) => ({
      notes: { $regex: search, $options: 'i' }
    })
  },
  equipment: {
    allowedSorts: ['name', 'availableUnits', 'createdAt'],
    defaultSort: { name: 1 },
    getSearchFilter: (search) => ({
      name: { $regex: search, $options: 'i' }
    })
  },
  loans: {
    allowedSorts: ['units', 'createdAt'],
    defaultSort: { createdAt: 1 },
    getSearchFilter: (search) => ({
      status: { $regex: search, $options: 'i' }
    })
  }
};

/**
 * Middleware para validar y procesar page, limit, sort y search de forma estricta
 * @param {string} resourceName - 'rooms' | 'bands' | 'musicians' | 'bookings' | 'equipment' | 'loans'
 */
const parseQueryParams = (resourceName) => {
  return (req, res, next) => {
    const config = RESOURCE_CONFIG[resourceName];
    if (!config) {
      return next();
    }

    let page = 1;
    let limit = 10;
    let sort = { ...config.defaultSort };

    // 1. Validar page
    if (req.query.page !== undefined) {
      const parsedPage = Number(req.query.page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return res.status(400).json({ error: 'El parámetro page debe ser un entero mayor o igual a 1' });
      }
      page = parsedPage;
    }

    // 2. Validar limit
    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 50) {
        return res.status(400).json({ error: 'El parámetro limit debe ser un entero entre 1 y 50' });
      }
      limit = parsedLimit;
    }

    // 3. Validar sort
    if (req.query.sort !== undefined && req.query.sort.trim() !== '') {
      const rawSort = req.query.sort.trim();
      let direction = 1;
      let field = rawSort;

      if (rawSort.startsWith('-')) {
        direction = -1;
        field = rawSort.substring(1);
      } else if (rawSort.startsWith('+')) {
        direction = 1;
        field = rawSort.substring(1);
      }

      if (!config.allowedSorts.includes(field)) {
        return res.status(400).json({
          error: `El campo de ordenamiento '${rawSort}' no es válido para ${resourceName}. Campos permitidos: ${config.allowedSorts.join(', ')}`
        });
      }

      sort = { [field]: direction };
    }

    // 4. Validar search
    let searchFilter = {};
    if (req.query.search !== undefined && req.query.search.trim() !== '') {
      searchFilter = config.getSearchFilter(req.query.search.trim());
    }

    req.pagination = {
      page,
      limit,
      skip: (page - 1) * limit,
      sort,
      searchFilter
    };

    next();
  };
};

module.exports = {
  parseQueryParams,
  RESOURCE_CONFIG
};
