import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: string;
  type: 'income' | 'outcome';
  category_id: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_id,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactionsBalance = await transactionsRepository.get();

    if (
      type === 'outcome' &&
      parseInt(value, 10) > transactionsBalance.balance.total
    ) {
      throw new AppError(
        'Não há fundos suficientes para efetuar a transação',
        400,
      );
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
