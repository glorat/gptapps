import retry from 'retry';
import {logger} from './logger'

export async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    const retryOptions: retry.OperationOptions = {
        retries: 6, // Maximum number of retries
        factor: 2, // Exponential backoff factor
        minTimeout: 1000, // Minimum delay between retries (in milliseconds)
    };

    const operation = retry.operation(retryOptions);

    return new Promise<T>((resolve, reject) => {
        operation.attempt(async (currentAttempt) => {
            try {
                const result = await fn();
                resolve(result);
            } catch (error: any) {
                if (operation.retry(error)) {
                    logger.warn(`Retrying due to ${error}... Attempt ${currentAttempt}`);
                    return;
                }
                reject(operation.mainError());
            }
        });
    });
}
