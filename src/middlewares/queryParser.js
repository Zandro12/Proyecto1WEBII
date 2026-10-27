// Función auxiliar para escapar caracteres especiales en expresiones regulares
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Configuración por recurso de ordenamiento permitido y orden por defecto
const RESOURCE_CONFIG = {
  rooms: {
    allowedSorts: ['name', 'capacity', 'floor', 'createdAt'],
    defaultSort: { name: 1 },
    getSearchFilter: (search) => ({
      name: { $regex: escapeRegex(search), $options: 'i' }
    })
  },
  bands: {
    allowedSorts: ['name', 'createdAt'],
    defaultSort: { name: 1 },
    getSearchFilter: (search) => ({
      name: { $regex: escapeRegex(search), $options: 'i' }
    })
  },
  musicians: {
    allowedSorts: ['name', 'instrument', 'createdAt'],
    defaultSort: { name: 1 },
    getSearchFilter: (search) => {
      const safe = escapeRegex(search);
      return {
        $or: [
          { name: { $regex: safe, $options: 'i' } },
          { email: { $regex: safe, $options: 'i' } }
        ]
      };
    }
  },
  bookings: {
    allowedSorts: ['date', 'startHour', 'createdAt'],
    defaultSort: { date: 1, startHour: 1 },
    getSearchFilter: (search) => ({
      notes: { $regex: escapeRegex(search), $options: 'i' }
    })
  },
  equipment: {
    allowedSorts: ['name', 'availableUnits', 'createdAt'],
    defaultSort: { name: 1 },
    getSearchFilter: (search) => ({
      name: { $regex: escapeRegex(search), $options: 'i' }
    })
  },
  loans: {
    allowedSorts: ['units', 'createdAt'],
    defaultSort: { createdAt: 1 },
    getSearchFilter: (search) => ({
      status: { $regex: escapeRegex(search), $options: 'i' }
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

    // Validar parámetros duplicados (arreglos)
    if (Array.isArray(req.query.page)) {
      return res.status(400).json({ error: 'El parámetro page no puede enviarse múltiples veces' });
    }
    if (Array.isArray(req.query.limit)) {
      return res.status(400).json({ error: 'El parámetro limit no puede enviarse múltiples veces' });
    }
    if (Array.isArray(req.query.sort)) {
      return res.status(400).json({ error: 'El parámetro sort no puede enviarse múltiples veces' });
    }
    if (Array.isArray(req.query.search)) {
      return res.status(400).json({ error: 'El parámetro search no puede enviarse múltiples veces' });
    }

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
    if (req.query.sort !== undefined) {
      if (typeof req.query.sort !== 'string') {
        return res.status(400).json({ error: 'El parámetro sort debe ser una cadena de texto' });
      }

      const rawSort = req.query.sort.trim();
      if (rawSort !== '') {
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
    }

    // 4. Validar search
    let searchFilter = {};
    if (req.query.search !== undefined) {
      if (typeof req.query.search !== 'string') {
        return res.status(400).json({ error: 'El parámetro search debe ser una cadena de texto' });
      }
      const rawSearch = req.query.search.trim();
      if (rawSearch !== '') {
        searchFilter = config.getSearchFilter(rawSearch);
      }
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
