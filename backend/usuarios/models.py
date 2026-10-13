from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    username = None

    email = models.EmailField(
        unique=True,
    )

    nome = models.CharField(
        max_length=150,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nome"]

    def __str__(self):
        return self.email