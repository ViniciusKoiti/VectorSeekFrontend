import { TestBed } from '@angular/core/testing';
import { QnaStore } from './qna.store';
import { QnaHistoryEntry } from '@vectorseek/data-access';

describe('QnaStore', () => {
  let store: QnaStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QnaStore]
    });
    store = TestBed.inject(QnaStore);
  });

  afterEach(() => {
    store.reset();
  });

  it('should be created with initial state', () => {
    expect(store).toBeTruthy();
    expect(store.currentQuestion()).toBe('');
    expect(store.currentAnswer()).toBeNull();
    expect(store.history()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.hasHistory()).toBe(false);
  });

  describe('setCurrentQuestion', () => {
    it('should update current question', () => {
      store.setCurrentQuestion('Test question?');
      expect(store.currentQuestion()).toBe('Test question?');
    });

    it('should clear error when setting question', () => {
      store.setError({
        status: 500,
        code: 'test_error',
        summary: 'Test error'
      });
      expect(store.error()).not.toBeNull();

      store.setCurrentQuestion('New question?');
      expect(store.error()).toBeNull();
    });
  });

  describe('setCurrentAnswer', () => {
    it('should update current answer', () => {
      const answer = {
        text: 'Test answer',
        citations: []
      };
      store.setCurrentAnswer(answer);
      expect(store.currentAnswer()).toEqual(answer);
    });

    it('should clear error when setting answer', () => {
      store.setError({
        status: 500,
        code: 'test_error',
        summary: 'Test error'
      });

      store.setCurrentAnswer({
        text: 'Answer',
        citations: []
      });
      expect(store.error()).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      expect(store.loading()).toBe(false);
      store.setLoading(true);
      expect(store.loading()).toBe(true);
      store.setLoading(false);
      expect(store.loading()).toBe(false);
    });
  });

  describe('setError', () => {
    it('should update error state', () => {
      const error = {
        status: 404,
        code: 'not_found',
        summary: 'Not found'
      };
      store.setError(error);
      expect(store.error()).toEqual(error);
      expect(store.hasError()).toBe(true);
    });

    it('should set loading to false when error is set', () => {
      store.setLoading(true);
      store.setError({
        status: 500,
        code: 'error',
        summary: 'Error'
      });
      expect(store.loading()).toBe(false);
    });
  });

  describe('setHistory', () => {
    it('should update history', () => {
      const history: QnaHistoryEntry[] = [
        {
          id: '1',
          question: {
            id: 'q1',
            text: 'Question 1',
            timestamp: new Date()
          },
          answer: {
            text: 'Answer 1',
            citations: []
          },
          timestamp: new Date()
        }
      ];

      store.setHistory(history);
      expect(store.history()).toEqual(history);
      expect(store.hasHistory()).toBe(true);
    });

    it('should clear error when setting history', () => {
      store.setError({
        status: 500,
        code: 'error',
        summary: 'Error'
      });

      store.setHistory([]);
      expect(store.error()).toBeNull();
    });
  });

  describe('setPagination', () => {
    it('should update pagination state', () => {
      const pagination = {
        total: 100,
        page: 2,
        pageSize: 10,
        totalPages: 10
      };

      store.setPagination(pagination);
      expect(store.pagination()).toEqual(pagination);
    });
  });

  describe('addToHistory', () => {
    it('should add entry to beginning of history', () => {
      const entry1: QnaHistoryEntry = {
        id: '1',
        question: {
          id: 'q1',
          text: 'Question 1',
          timestamp: new Date()
        },
        answer: {
          text: 'Answer 1',
          citations: []
        },
        timestamp: new Date()
      };

      const entry2: QnaHistoryEntry = {
        id: '2',
        question: {
          id: 'q2',
          text: 'Question 2',
          timestamp: new Date()
        },
        answer: {
          text: 'Answer 2',
          citations: []
        },
        timestamp: new Date()
      };

      store.addToHistory(entry1);
      expect(store.history().length).toBe(1);
      expect(store.history()[0]).toEqual(entry1);

      store.addToHistory(entry2);
      expect(store.history().length).toBe(2);
      expect(store.history()[0]).toEqual(entry2);
      expect(store.history()[1]).toEqual(entry1);
    });
  });

  describe('clearCurrentQuestion', () => {
    it('should clear question and answer', () => {
      store.setCurrentQuestion('Test?');
      store.setCurrentAnswer({
        text: 'Answer',
        citations: []
      });

      store.clearCurrentQuestion();
      expect(store.currentQuestion()).toBe('');
      expect(store.currentAnswer()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      store.setError({
        status: 500,
        code: 'error',
        summary: 'Error'
      });

      store.clearError();
      expect(store.error()).toBeNull();
      expect(store.hasError()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      store.setCurrentQuestion('Test?');
      store.setCurrentAnswer({
        text: 'Answer',
        citations: []
      });
      store.setLoading(true);
      store.setError({
        status: 500,
        code: 'error',
        summary: 'Error'
      });

      store.reset();

      expect(store.currentQuestion()).toBe('');
      expect(store.currentAnswer()).toBeNull();
      expect(store.history()).toEqual([]);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });
  });

  describe('pagination computed values', () => {
    it('should identify first page correctly', () => {
      store.setPagination({
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10
      });
      expect(store.isFirstPage()).toBe(true);

      store.setPagination({
        total: 100,
        page: 2,
        pageSize: 10,
        totalPages: 10
      });
      expect(store.isFirstPage()).toBe(false);
    });

    it('should identify last page correctly', () => {
      store.setPagination({
        total: 100,
        page: 10,
        pageSize: 10,
        totalPages: 10
      });
      expect(store.isLastPage()).toBe(true);

      store.setPagination({
        total: 100,
        page: 9,
        pageSize: 10,
        totalPages: 10
      });
      expect(store.isLastPage()).toBe(false);
    });
  });

  describe('abort controller', () => {
    it('should create abort signal', () => {
      const signal = store.getAbortSignal();
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });

    it('should cancel pending request', () => {
      const signal = store.getAbortSignal();
      expect(signal.aborted).toBe(false);

      store.cancelPendingRequest();
      expect(signal.aborted).toBe(true);
    });

    it('should set loading to false when canceling', () => {
      store.setLoading(true);
      store.getAbortSignal();
      store.cancelPendingRequest();
      expect(store.loading()).toBe(false);
    });
  });
});
