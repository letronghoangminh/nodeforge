output "repository_name" {
  value = aws_ecr_repository.main.name
}

output "repository_arn" {
  value = aws_ecr_repository.main.arn
}

output "repository_url" {
  value = aws_ecr_repository.main.repository_url
}
