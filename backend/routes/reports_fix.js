// Reemplazar la ruta de cancelados
const fixedRoute = `
router.get('/cancelled', async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const { count, rows } = await Sale.findAndCountAll({
      where: {
        ...dateFilter,
        status: 'cancelled'
      },
      include: [
        { model: User, attributes: ['id', 'name', 'username'] },
        { model: SaleItem, include: [MenuItem] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      cancelledSales: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo tickets cancelados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
`;
