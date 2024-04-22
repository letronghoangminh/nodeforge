output "queue" {
  value = aws_sqs_queue.queue
}

output "queue_url" {
  value = aws_sqs_queue.queue.url
}

output "queue_arn" {
  description = "The ARN of the SQS queue"
  value       = aws_sqs_queue.queue.arn
}

output "iam_policy_sqs_write_arn" {
  value = aws_iam_policy.write.arn
}

output "iam_policy_sqs_read_arn" {
  value = aws_iam_policy.read.arn
}

output "iam_policy_sqs_read_write_arn" {
  value = aws_iam_policy.read-write.arn
}
