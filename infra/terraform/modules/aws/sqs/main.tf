data "aws_caller_identity" "current" {}

locals {
  suffix     = var.fifo_enabled ? ".fifo" : ""
  queue_name = "${var.name}${local.suffix}"
}

resource "aws_sqs_queue" "queue" {
  name                       = local.queue_name
  visibility_timeout_seconds = var.visibility_timeout_seconds
  delay_seconds              = var.delay_seconds
  max_message_size           = var.max_size
  message_retention_seconds  = var.retention_seconds
  receive_wait_time_seconds  = var.wait_seconds

  fifo_queue                  = var.fifo_enabled
  deduplication_scope         = var.fifo_deduplication_scope
  fifo_throughput_limit       = var.fifo_throughput_limit
  content_based_deduplication = var.content_based_deduplication
}

data "aws_iam_policy_document" "this" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = var.principal_roles != null ? var.principal_roles : ["*"]
    }

    actions   = ["sqs:*"]
    resources = [aws_sqs_queue.queue.arn]
  }
}

resource "aws_sqs_queue_policy" "this" {
  queue_url = aws_sqs_queue.queue.id
  policy    = data.aws_iam_policy_document.this.json
}
