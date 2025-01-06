class InMemoryQueue {
  private queue: any[] = []
  private processing: boolean = false

  enqueue(job: () => Promise<void>) {
    this.queue.push(job)
    this.processNext()
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) {
      return
    }
    this.processing = true
    const job = this.queue.shift()
    try {
      await job()
    } catch (error) {
      console.error('Error processing job:', error)
      // Optionally, you can re-enqueue the job for retry
    } finally {
      this.processing = false
      this.processNext()
    }
  }
}

export const rechargeQueue = new InMemoryQueue()
