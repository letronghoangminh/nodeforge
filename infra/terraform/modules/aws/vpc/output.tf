output "id" {
  value = aws_vpc.main.id
}

output "public_subnets" {
  value = aws_subnet.public
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}
