import datetime
from decimal import Decimal
import re

class TransformationEngine:
    """
    Engine to apply transformations to data.
    """

    @staticmethod
    def apply(value, transformation_rule):
        """
        Apply a transformation rule to a value.
        rule format: "FUNCTION_NAME" or "FUNCTION_NAME(arg1, arg2)"
        """
        if not transformation_rule:
            return value

        # Simple parsing for function calls with arguments e.g. DATE_FORMAT(%Y-%m-%d)
        # This is a basic implementation. A proper parser would be better for complex cases.
        func_name = transformation_rule.split('(')[0].strip().upper()
        args = []
        if '(' in transformation_rule and transformation_rule.endswith(')'):
            args_str = transformation_rule[transformation_rule.index('(')+1:-1]
            if args_str:
                args = [arg.strip() for arg in args_str.split(',')]

        method = getattr(TransformationEngine, f"func_{func_name}", None)
        if method:
            try:
                return method(value, *args)
            except Exception as e:
                return f"ERROR: {str(e)}"
        return value

    # String Functions
    @staticmethod
    def func_UPPERCASE(value, *args):
        return str(value).upper() if value else value

    @staticmethod
    def func_LOWERCASE(value, *args):
        return str(value).lower() if value else value

    @staticmethod
    def func_TRIM(value, *args):
        return str(value).strip() if value else value

    @staticmethod
    def func_REMOVE_PUNCTUATION(value, *args):
        if not value: return value
        return re.sub(r'[^\w\s]', '', str(value))

    # Numeric Functions
    @staticmethod
    def func_ROUND(value, *args):
        try:
            return round(float(value), int(args[0]) if args else 0)
        except:
            return value

    # Date Functions
    @staticmethod
    def func_DATE_FORMAT(value, *args):
        # Assumes value is ISO format string or datetime object
        pattern = args[0] if args else "%Y-%m-%d"
        try:
            if isinstance(value, str):
                dt = datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
            else:
                dt = value
            return dt.strftime(pattern)
        except Exception as e:
            return value # Return original on failure

    # Logic
    @staticmethod
    def func_DEFAULT(value, *args):
        return value if value else (args[0] if args else None)
