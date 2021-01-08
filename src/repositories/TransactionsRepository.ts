import { EntityRepository, Repository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface TransactionsWithCategory {
  id: string;
  title: string;
  value: string;
  type: 'income' | 'outcome';
  category: {
    id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
  };
  created_at: Date;
  updated_at: Date;
}

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionsWithBalance {
  transactions: TransactionsWithCategory[];
  balance: Balance;
}

// interface CategoryData {
//   title: string;
// }

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async get(): Promise<TransactionsWithBalance> {
    const transactions = await this.find({
      relations: ['category'],
    });

    // montar um array com as transações com a categoria

    const transactionsWithCategories = transactions.map(item => {
      return {
        id: item.id,
        title: item.title,
        value: item.value,
        type: item.type,
        category: {
          id: item.category.id,
          title: item.category.title,
          created_at: item.category.created_at,
          updated_at: item.category.updated_at,
        },
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    const totalIncome = transactions.reduce((total, item) => {
      if (item.type === 'income') {
        return total + parseInt(item.value, 10);
      }
      return total;
    }, 0);

    const totalOutcome = transactions.reduce((total, item) => {
      if (item.type === 'outcome') {
        return total + parseInt(item.value, 10);
      }
      return total;
    }, 0);

    const total = totalIncome - totalOutcome;

    const balance: Balance = {
      income: totalIncome,
      outcome: totalOutcome,
      total,
    };

    const transactionsWithBalance = {
      transactions: transactionsWithCategories,
      balance,
    };

    return transactionsWithBalance;
  }

  public async verifyCategory(title: string): Promise<Category> {
    const categoriesRepository = getRepository(Category);

    const checkCategoryExists = await categoriesRepository.findOne({
      where: { title },
    });

    if (checkCategoryExists) {
      return checkCategoryExists;
    }

    const category = categoriesRepository.create({
      title,
    });

    await categoriesRepository.save(category);
    return category;
  }
}

export default TransactionsRepository;
