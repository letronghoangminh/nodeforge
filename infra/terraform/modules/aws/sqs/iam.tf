resource "aws_iam_policy" "read" {
  name        = "SqsRead-${var.name}"
  description = "Policy that allows receive message from a shared queue."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Effect = "Allow"
        Resource = [
          aws_sqs_queue.queue.arn
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "write" {
  name        = "SqsWrite-${var.name}"
  description = "Policy that allows send message from a shared queue."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:SendMessage",
        ]
        Effect = "Allow"
        Resource = [
          aws_sqs_queue.queue.arn
        ],
      },
    ]
  })
}

resource "aws_iam_policy" "read-write" {
  name        = "SqsReadWrite-${var.name}"
  description = "Policy that allows send and receive message from a shared queue."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage",
        ]
        Effect = "Allow"
        Resource = [
          aws_sqs_queue.queue.arn
        ],
      },
    ]
  })
}
