import { isUuid } from 'uuidv4';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
// import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (!isUuid(id)) {
      throw new AppError('invalid transaction id');
    }
    const transactionExists = await transactionsRepository.findOne({
      where: { id },
    });

    if (!transactionExists) {
      throw new AppError('The requested transaction does not exist', 404);
    }

    await transactionsRepository.delete(id);
    console.log(id);
  }
}

export default DeleteTransactionService;
