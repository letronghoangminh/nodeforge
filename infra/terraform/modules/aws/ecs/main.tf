resource "aws_iam_role" "ecs_task_role" {
  name = "${var.name}-ecsTaskRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_cloudwatch_log_group" "main" {
  name = "/ecs/${var.name}-task"

  tags = {
    Name = "${var.name}-task"
  }
}

resource "aws_ecs_cluster" "main" {
  name = "${var.name}-cluster"
  tags = {
    Name = "${var.name}-cluster"
  }
}

output "cluster" {
  value = aws_ecs_cluster.main
}

output "ecs_task_role" {
  value = aws_iam_role.ecs_task_role
}
