import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import Transaction from '../models/Transaction';

// import TransactionsRepository from '../repositories/TransactionsRepository';
// import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

interface Categories {
  id: string;
  title: string;
}

const transactionsRouter = Router();

const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  try {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const results = await transactionsRepository.get();

    return response.json(results);
  } catch (err) {
    return response.status(err.statusCode).json({ error: err.message });
  }
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  try {
    const createTransactionService = new CreateTransactionService();

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const categoryId = await transactionsRepository.verifyCategory(category);

    const transaction = await createTransactionService.execute({
      title,
      value,
      type,
      category_id: categoryId.id,
    });

    return response.json(transaction);
  } catch (err) {
    return response
      .status(err.statusCode)
      .json({ message: err.message, status: 'error' });
  }
});

transactionsRouter.delete('/:id', async (request, response) => {
  try {
    const { id } = request.params;

    const deleteTransactionService = new DeleteTransactionService();

    await deleteTransactionService.execute({ id });

    return response.status(200).send();
  } catch (err) {
    return response
      .status(err.statusCode)
      .json({ error: err.message, status: err.statusCode });
  }
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    try {
      const filePath = request.file.path;
      const importTransactionService = new ImportTransactionsService();

      const transactionsImport = await importTransactionService.execute({
        filePath,
      });

      return response.json(transactionsImport.transactions);
    } catch (err) {
      return response.status(err.statusCode).json({ error: err.message });
    }
  },
);

export default transactionsRouter;
